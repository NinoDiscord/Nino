import { Constants, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import PermissionUtils from '../../util/PermissionUtils';
import CommandContext from '../../structures/Context';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Bot from '../../structures/Bot';

@injectable()
export default class LockdownCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'lockdown',
      description:
        'Locks down a channel, multiple channels or all channels for all roles below the specified role. Put + or - before the role to specify whether to allow the role to write or deny the permission.',
      aliases: ['lock'],
      category: 'Moderation',
      guildOnly: true,
      botPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
      userPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
      usage:
        '[all] <channel> <channel>... [--roles=[+/-]<role>, [+/-]<role>, ...] [--release]',
    });
  }

  getChannel(s: string, ctx: CommandContext) {
    if (/^[0-9]+$/.test(s)) {
      const channel = ctx.guild!.channels.get(s);
      if (!channel || [1, 2, 3, 4].includes(channel.type)) return;
      return (channel as TextChannel);
    } else if (/^<#[0-9]+>$/.test(s)) {
      const id = s.substring(2, s.length - 1);
      const channel = ctx.guild!.channels.get(id);
      if (!channel || [1, 2, 3, 4].includes(channel.type)) return;
      return (channel as TextChannel);
    }

    return ctx.guild!.channels.find(x => x.type === 0 && x.name.toLowerCase() === s) as TextChannel | undefined;
  }

  getRole(s: string, ctx: CommandContext) {
    if (/^[0-9]+$/.test(s)) return ctx.guild!.roles.get(s);
    else if (/^<@&[0-9]+>$/.test(s)) {
      const id = s.substring(3, s.length - 1);
      return ctx.guild!.roles.get(id);
    }

    return ctx.guild!.roles.find(x => x.name.toLowerCase() === s);
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.has(0)) return ctx.send('The channels argument is required.');

    const roles = ctx.flags.get('roles');
    if (!roles) return ctx.send('You must first specify the roles to change permissions to using the --roles flag!');
    if (typeof roles === 'boolean') return ctx.send('The roles flag must have a `=` after the flag! (example: `--roles=Muted, Proxy`)');

    const release = ctx.flags.get('release');
    const allRoles = (roles as string)
      .split(', ')
      .map(role => !release ? {
        perm: role[0],
        role: this.getRole(role.slice(1), ctx) 
      } : {
        role: this.getRole(role, ctx)
      }).filter(({ role }) => 
        role && PermissionUtils.topRole(ctx.me) && PermissionUtils.topRole(ctx.me)!.position > role.position
      ).map(role => role!);

    if (!roles.length) return ctx.send('All the roles you specified, I can\'t modify! Check if the roles are under me in heirarchy!');

    const channels = ctx.args.args.findIndex(x => x === 'all') === -1 ?
      ctx.guild!.channels.filter(c => c.type === 0).map(c => c as TextChannel) :
      ctx.args.args.map(x => this.getChannel(x, ctx)).filter(x => x).map(tc => tc!);

    if (!channels.length) return ctx.send('No valid channels were selected');
    if (!release) {
      const message = await ctx.send('Now backing up former permissions');
      const state = channels.map(c => ({
        channel: c,
        position: c.permissionOverwrites
          .filter(r => !!allRoles.find(role => role.role!.id === r.id))
          .map(pos => ({
            role: pos.id,
            allow: pos.allow,
            deny: pos.deny
          }))
      }));

      for (const current of state) await this.bot.redis.set(`lockdown:${current.channel.id}`, JSON.stringify(current.position));
      return message.edit('Backed up all former permissions');
    }

    for (const channel of channels) {
      const me = channel.permissionsOf(ctx.me.id);
      if (((ctx.me.permission.allow | me.allow) & Constants.Permissions.manageChannels) !== 0) {
        if (release as boolean) {
          const former = await this.bot.redis.get(`lockdown:${channel.id}`);
          if (former) {
            for (const pos of JSON.parse(former)) await channel.editPermission(pos.role, pos.allow, pos.deny, 'role', '[Lockdown] Lockdown is over');
            for (const role of allRoles.filter(r => !JSON.parse(former).find(role => r.role!.id === role.id))) await channel.deletePermission(role.role!.id, '[Lockdown] Lockdown is over');
            return ctx.send(`Channel ${channel.mention} is now unlocked`);
          }

          await this.bot.redis.del(`lockdown:${channel.id}`);
        } else {
          for (const role of allRoles) {
            let allow = channel.permissionOverwrites.has(role.role!.id) ? channel.permissionOverwrites.get(role.role!.id)!.allow : 0;
            let denied = channel.permissionOverwrites.has(role.role!.id) ? channel.permissionOverwrites.get(role.role!.id)!.deny : 0;
            if (role.perm === '+') await channel.editPermission(role.role!.id, allow | Constants.Permissions.sendMessages, denied & ~Constants.Permissions.sendMessages, 'role', '[Lockdown] Channel lockdown has started');
            else if (role.perm === '-') await channel.editPermission(role.role!.id, allow & ~Constants.Permissions.sendMessages, denied | Constants.Permissions.sendMessages, 'role', '[Lockdown] Channel lockdown has started');
          }

          return ctx.send(`Channel ${channel.mention} is now on lockdown`);
        }
      }
    }
  }
}