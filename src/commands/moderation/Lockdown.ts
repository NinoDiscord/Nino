import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import { Constants, TextChannel, Role } from 'eris';
import CommandContext from '../../structures/Context';
import PermissionUtils from '../../util/PermissionUtils';

export default class LockdownCommand extends Command {
  constructor(client: Bot) {
    super(client, {
      name: 'lockdown',
      description:
        'Locks down a channel, multiple channels or all channels for all roles below the specified role. Put + or - before the role to specify whether to allow the role to write or deny the permission.',
      aliases: ['lock'],
      category: 'Moderation',
      guildOnly: true,
      botpermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
      userpermissions:
        Constants.Permissions.manageRoles |
        Constants.Permissions.manageChannels,
      usage:
        '[all] <channel> <channel>... [--roles=[+/-]<role>, [+/-]<role>, ...] [--release]',
    });
  }

  getChannel(s: string, ctx: CommandContext): TextChannel | undefined {
    if (/^[0-9]+$/.test(s)) {
      // this is an id
      const channel = ctx.guild.channels.get(s);
      if (!channel || channel.type === 0) return;
      return channel as TextChannel;
    } else if (/^<#[0-9]+>$/.test(s)) {
      // this is a channel mention
      const channel = ctx.guild.channels.get(s.substring(2, s.length - 1));
      if (!channel || channel.type !== 0) return;
      return channel as TextChannel;
    }
    return ctx.guild.channels.find(
      x => x.type === 0 && x.name.toLowerCase() === s
    ) as TextChannel;
  }

  getRole(s: string, ctx: CommandContext): Role | undefined {
    if (/^[0-9]+$/.test(s)) {
      // this is an id
      return ctx.guild.roles.get(s);
    } else if (/^<@&[0-9]+>$/.test(s)) {
      // this is a channel mention
      return ctx.guild.roles.get(s.substring(3, s.length - 1));
    }
    return ctx.guild.roles.find(x => x.name.toLowerCase() === s);
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.has(0)) return ctx.send('The channels argument is required.');
    if (!ctx.flags.get('roles'))
      return ctx.send(
        'You must first specify the roles to change permissions to using the --roles flag!'
      );
    if (ctx.flags.get('roles') === true)
      return ctx.send('The roles flag is not supposed to be a boolean!');
    const roles = (ctx.flags.get('roles') as string)
      .split(/\s*,\s+/)
      .map(role => {
        return !ctx.flags.get('release')
          ? { perm: role[0], role: this.getRole(role.slice(1), ctx) }
          : { role: this.getRole(role, ctx) };
      })
      .filter(
        ({ role }) =>
          !!role &&
          PermissionUtils.topRole(ctx.me) &&
          PermissionUtils.topRole(ctx.me)!.position > role.position
      )
      .map(r => r!);

    if (roles.length === 0)
      return ctx.send(
        "All of the roles you've listed can not be modified by me! Please check that the roles are under this bot in the heirarchy."
      );

    const channels =
      ctx.args.args.findIndex(x => x === 'all') !== -1
        ? ctx.guild.channels
            .filter(c => c.type === 0)
            .map(c => c as TextChannel)
        : ctx.args.args
            .map(x => this.getChannel(x, ctx))
            .filter(x => !!x)
            .map(tc => tc!);

    if (channels.length === 0)
      return ctx.send('No valid channels were selected.');

    if (!ctx.flags.get('release')) {
      const msg = await ctx.send('Backing up former permissions...');
      const currstate = channels.map(c => {
        return {
          channel: c,
          pos: c.permissionOverwrites
            .filter(r => !!roles.find(ro => ro.role!.id === r.id))
            .map(po => {
              return { role: po.id, allow: po.allow, deny: po.deny };
            }),
        };
      });

      for (let { channel, pos } of currstate)
        await ctx.bot.redis.set(
          `lockdownstate:${channel.id}`,
          JSON.stringify(pos)
        );
      msg.edit('Done!');
    }

    for (let channel of channels) {
      if (
        ((ctx.me.permission.allow | channel.permissionsOf(ctx.me.id).allow) &
          Constants.Permissions.manageChannels) !==
        0
      ) {
        if (ctx.flags.get('release') as boolean) {
          const formerperms = await ctx.bot.redis.get(
            `lockdownstate:${channel.id}`
          );
          if (!!formerperms) {
            for (let po of JSON.parse(formerperms))
              await channel.editPermission(
                po.role,
                po.allow,
                po.deny,
                'role',
                'Channel Lockdown Over'
              );
            for (let role of roles.filter(
              r => !JSON.parse(formerperms).find(ro => r.role!.id === ro.role!)
            ))
              await channel.deletePermission(
                role.role!.id,
                'Channel Lockdown Over'
              );
            await ctx.send(`Channel ${channel.mention} is now unlocked.`);
          }
          await ctx.bot.redis.del(`lockdownstate:${channel.id}`);
        } else {
          for (let role of roles) {
            let allow = channel.permissionOverwrites.has(role.role!.id)
              ? channel.permissionOverwrites.get(role.role!.id)!.allow
              : 0;
            let deny = channel.permissionOverwrites.has(role.role!.id)
              ? channel.permissionOverwrites.get(role.role!.id)!.deny
              : 0;
            if (role.perm === '+')
              await channel.editPermission(
                role.role!.id,
                allow | Constants.Permissions.sendMessages,
                deny & ~Constants.Permissions.sendMessages,
                'role',
                'Channel Lockdown Started'
              );
            else if (role.perm === '-')
              await channel.editPermission(
                role.role!.id,
                allow & ~Constants.Permissions.sendMessages,
                deny | Constants.Permissions.sendMessages,
                'role',
                'Channel Lockdown Started'
              );
          }
          await ctx.send(`Channel ${channel.mention} is now locked down.`);
        }
      }
    }
  }
}
