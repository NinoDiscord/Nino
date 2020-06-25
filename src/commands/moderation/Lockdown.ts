import { Constants, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import PermissionUtils from '../../util/PermissionUtils';
import CommandContext from '../../structures/Context';
import { Module } from '../../util';
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
      description: 'Locks down a channel, multiple channels or all channels for all roles below the specified role. Put + or - before the role to specify whether to allow the role to write or deny the permission.',
      aliases: ['lock'],
      category: Module.Moderation,
      guildOnly: true,
      botPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
      userPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
      usage: '[all] <channel> <channel>... [--roles=[+/-]<role>, [+/-]<role>, ...] [--release]'
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
    if (!ctx.args.has(0)) return ctx.sendTranslate('commands.moderation.lockdown.noChannels');

    const roles = ctx.flags.get('roles');
    if (!roles) return ctx.sendTranslate('commands.moderation.lockdown.noRoles');
    if (typeof roles === 'boolean') return ctx.sendTranslate('global.invalidFlag.string');

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

    if (!roles.length) return ctx.sendTranslate('commands.moderation.lockdown.cantModify');

    const channels = ctx.args.args.findIndex(x => x === 'all') === -1 ?
      ctx.guild!.channels.filter(c => c.type === 0).map(c => c as TextChannel) :
      ctx.args.args.map(x => this.getChannel(x, ctx)).filter(x => x).map(tc => tc!);

    if (!channels.length) return ctx.sendTranslate('commands.moderation.lockdown.cantModifyChannels');
    if (!release) {
      const message = await ctx.sendTranslate('commands.moderation.lockdown.backingUp');
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
      await message.edit(ctx.translate('commands.moderation.lockdown.backedUp'));
    }

    for (const channel of channels) {
      const me = channel.permissionsOf(ctx.me.id);
      if (((ctx.me.permission.allow | me.allow) & Constants.Permissions.manageChannels) !== 0) {
        if (release as boolean) {
          const former = await this.bot.redis.get(`lockdown:${channel.id}`);
          if (former) {
            for (const pos of JSON.parse(former)) await channel.editPermission(pos.role, pos.allow, pos.deny, 'role', '[Lockdown] Lockdown is over');
            for (const role of allRoles.filter(r => !JSON.parse(former).find(role => r.role!.id === role.id))) await channel.deletePermission(role.role!.id, '[Lockdown] Lockdown is over');
            return ctx.sendTranslate('commands.moderation.lockdown.unlock', {
              channel: channel.mention
            });
          }

          await this.bot.redis.del(`lockdown:${channel.id}`);
        } else {
          for (const role of allRoles) {
            let allow = channel.permissionOverwrites.has(role.role!.id) ? channel.permissionOverwrites.get(role.role!.id)!.allow : 0;
            let denied = channel.permissionOverwrites.has(role.role!.id) ? channel.permissionOverwrites.get(role.role!.id)!.deny : 0;
            if (role.perm === '+') await channel.editPermission(role.role!.id, allow | Constants.Permissions.sendMessages, denied & ~Constants.Permissions.sendMessages, 'role', '[Lockdown] Channel lockdown has started');
            else if (role.perm === '-') await channel.editPermission(role.role!.id, allow & ~Constants.Permissions.sendMessages, denied | Constants.Permissions.sendMessages, 'role', '[Lockdown] Channel lockdown has started');
          }

          return ctx.sendTranslate('commands.moderation.lockdown.locked', {
            channel: channel.mention
          });
        }
      }
    }
  }
}
