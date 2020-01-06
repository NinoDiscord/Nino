import { TextChannel, Constants, Member, Message, Guild, User, Role } from 'eris';
import { inject, injectable } from 'inversify';
import { stripIndents } from 'common-tags';
import PermissionUtils from '../../util/PermissionUtils';
import { CaseModel } from '../../models/CaseSchema';
import EmbedBuilder from '../EmbedBuilder';
import { TYPES } from '../../types';
import Bot from '../Bot';
import ms = require('ms');
import 'reflect-metadata';

/**
 * Punishment types
 *
 * @remarks
 * * Ban should be either a softban or a ban and should have a parameter for amount of days to delete messages.
 * * Kick is simple
 * * Mute can have the amount of time for a mute as a parameter (template: 1d2h3m4s).
 * * AddRole is to add a role, it should have roleid as a parameter
 */
export enum PunishmentType {
  Ban = 'ban',
  Kick = 'kick',
  Mute = 'mute',
  AddRole = 'role',
  Unmute = 'unmute',
  Unban = 'unban',
  RemoveRole = 'unrole',
}

export interface PunishmentOptions {
  days?: number;
  soft?: boolean;
  moderator: User;
  temp?: number;
  roleid?: string;
}

/**
 * A punishment contains its type and other options.
 *
 * @remarks
 * Other options can include amount of time in milliseconds for a mute,
 * amount of days to delete messages from,
 * the type of ban (softban/ban).
 */
export class Punishment {
  public type: PunishmentType;
  public options: PunishmentOptions;

  constructor(type: PunishmentType, options: PunishmentOptions) {
    this.type = type;
    this.options = options;
  }
}

/**
 * This class will automate the process of warning and punishing users.
 */
@injectable()
export default class PunishmentManager {
  private bot: Bot;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.bot = bot;
  }

  /**
   * Returns the permissions needed to execute a punishment
   * @param punishment the punishment
   */
  getPermissions(punishment: Punishment) {
    if (['role', 'unmute', 'unrole'].includes(punishment.type)) return Constants.Permissions.manageRoles;
    if (['ban', 'unban'].includes(punishment.type)) return Constants.Permissions.banMembers;
    if (punishment.type === 'kick') return Constants.Permissions.kickMembers;
    if (punishment.type === 'mute') return Constants.Permissions.manageRoles | Constants.Permissions.manageChannels;
    return 0;
  }

  /**
   * Warns the user and punishes him according to the server's settings.
   * Returns the punishment for the amount of warnings he now has (if exists)
   * @param member the member to warn
   */
  async addWarning(member: Member): Promise<Punishment[]> {
    const me = member.guild.members.get(this.bot.client.user.id)!;
    const settings = await this.bot.settings.get(member.guild.id);
    if (!settings) return [];

    let warnings = await this.bot.warnings.get(member.guild.id, member.id);
    if (!warnings) {
      warnings = this.bot.warnings.create(member.guild.id, member.id);
    }
    else {
      await this.bot.warnings.update(member.guild.id, member.id, {
        amount: Math.min(warnings.amount + 1, 5)
      });
    }

    const warns = Math.min(!!warnings ? warnings!.amount + 1 : 1, 5);
    const result: Punishment[] = [];
    for (let options of settings.punishments.filter(x => x.warnings === warns)) {
      const punishment = new Punishment(options.type as PunishmentType, Object.assign({ moderator: me.user }, options));
      result.push(punishment);
    }

    return result;
  }

  /**
   * Pardons the member (reduces amount of warnings by the amount given)
   *
   * @remarks
   * Round the amount before applying it here
   *
   * @param member the member
   * @param amount the amount of warnings to remove
   */
  async pardon(member: Member, amount: number) {
    let warnings = await this.bot.warnings.get(member.guild.id, member.id);
    if (!!warnings && amount > 0) await this.bot.warnings.update(member.guild.id, member.id, {
      amount: Math.max(0, warnings.amount - amount),
    });
  }

  /**
   * Punishes the given member.
   *
   * @remarks
   * It automatically ignores the request when the permissions are insufficient.
   *
   * @param member the member
   * @param punishment the punishment
   * @param reason the reason
   */
  async punish(member: Member | { id: string; guild: Guild }, punishment: Punishment, reason?: string) {
    const me = member.guild.members.get(this.bot.client.user.id)!;
    const guild = member.guild;
    const settings = await this.bot.settings.get(guild.id);

    if (
      (member instanceof Member && !PermissionUtils.above(me, member)) ||
      (me.permission.allow & this.getPermissions(punishment)) === 0
    ) return;

    switch (punishment.type) {
      case PunishmentType.Ban: {
        const days = punishment.options.days ? punishment.options.days : 7;
        const time = punishment.options.temp;
        const soft = !!punishment.options.soft;

        await guild.banMember(member.id, days, reason);
        if (soft) await guild.unbanMember(member.id, reason);
        else if (time !== undefined && time > 0) {
          await this.bot.timeouts.addTimeout(member.id, member.guild, 'unban', time!);
        }
      } break;

      case PunishmentType.Kick: {
        if (!(member instanceof Member)) return;
        await member.kick(reason);
      } break;

      case PunishmentType.Mute: {
        if (!(member instanceof Member)) return;
        const temp = punishment.options.temp;
        let mutedRole: string | Role = settings!.mutedRole;
        if (!mutedRole) {
          const role = guild.roles.find(x => x.name === 'Muted');
          if (!role) {
            mutedRole = await guild.createRole({
              name: 'Muted',
              permissions: 0,
              mentionable: false,
              hoist: false
            }, '[Automod] Created "Muted" role');

            const topRole = PermissionUtils.topRole(me)!;
            await mutedRole.editPosition(topRole.position - 1);

            for (let [id, channel] of guild.channels) {
              const permissions = channel.permissionsOf(me.id);
              if (permissions.has('manageChannels')) {
                await channel.editPermission(mutedRole.id, 0, Constants.Permissions.sendMessages, 'role', `[Automod] Override permissions for new Muted role in channel ${channel.name}`);
              }
            }

            settings!.mutedRole = mutedRole.id;
            settings!.save();
          }

          await member.addRole((mutedRole as Role).id, reason);
          if (!!temp) this.bot.timeouts.addTimeout(member.id, guild, 'unmute', temp!);
        }
      } break;

      case PunishmentType.AddRole: {
        if (!(member instanceof Member)) return;

        const role = member.guild.roles.get(punishment.options.roleid!);
        if (!!role && !!PermissionUtils.topRole(me) && PermissionUtils.topRole(me)!.position > role.position) await member.addRole(role.id, reason);
      } break;

      case PunishmentType.Unmute: {
        let mem: Member | { id: string; guild: Guild; } | undefined = member;
        if (!(member instanceof Member)) mem = guild.members.get(mem.id);
        if (!mem) return;

        const muted = guild.roles.get(settings!.mutedRole)!;
        if (!!(mem as Member).roles.find(x => x === muted.id)) await (mem! as Member).removeRole(muted.id, reason);
      } break;

      case PunishmentType.Unban: {
        if (!guild.members.find(x => x.id === member.id)) await guild.unbanMember(member.id, reason);
      } break;

      case PunishmentType.RemoveRole: {
        const role = member.guild.roles.get(punishment.options.roleid!);
        if (
          member instanceof Member &&
          !!role &&
          !!PermissionUtils.topRole(me) &&
          PermissionUtils.topRole(me)!.position > role.position
        ) await member.removeRole(role.id, reason);
      } break;
    }

    if (
      punishment.type !== PunishmentType.AddRole &&
      punishment.type !== PunishmentType.RemoveRole
    ) {
      if (member instanceof Member) return this.postToModLog(member, punishment, reason);
      else {
        const user = await this.bot.client.getRESTUser(member.id);
        return this.postToModLog({
          username: user.username,
          discriminator: user.discriminator,
          guild: member.guild,
          id: member.id
        }, punishment, reason);
      }
    }
  }

  /**
   * Posts a punishment to the mod-log
   *
   * @remarks
   *
   *
   * @param member the member
   * @param punishment the punishment
   * @param reason the reason
   */
  async postToModLog(member: Member | { guild: Guild; id: string; username: string; discriminator: string }, punishment: Punishment, reason?: string) {
    const settings = await this.bot.settings.get(member.guild.id);
    if (!settings || !settings!.modlog) return;

    const modlog = member.guild.channels.get(settings!.modlog) as TextChannel;
    if (
      !!modlog &&
      modlog!.permissionsOf(this.bot.client.user.id).has('sendMessages') &&
      modlog!.permissionsOf(this.bot.client.user.id).has('embedLinks')
    ) {
      const action = this.determineType(punishment.type);
      const c = await this.bot.cases.create(member.guild.id, punishment.options.moderator.id, punishment.type, member.id, reason);
      try {
        const message = await modlog.createMessage({
          embed: new EmbedBuilder()
            .setTitle(`Case #${c.id} | ${member.username} has been ${punishment.type + action.suffix}`)
            .setColor(action.color)
            .setDescription(stripIndents`
              **User**: ${member.username}#${member.discriminator}
              **Moderator**: ${punishment.options.moderator.username}#${punishment.options.moderator.discriminator}
              **Reason**: ${reason || `Unknown (*edit the case with \`${settings!.prefix}reason ${c.id} <reason>\`*)`}
              ${!!punishment.options.soft ? '**Type**: Soft Ban' : ''}
              ${!punishment.options.soft && !!punishment.options.temp ? `**Time**: ${ms(punishment.options.temp, { long: true })}` : ''}
            `)
            .build()
        });

        await this.bot.cases.update(member.guild.id, c.id, {
          message: message.id
        }, error => error ? this.bot.logger.error(`Unable to update case:\n${error}`) : null);
        return undefined;
      }
      catch(ex) {
        this.bot.logger.error(`Unable to post to modlog:\n${ex}`);
        return `Sorry ${punishment.options.moderator.username}, I was unable to publish case #${c.id} to the mod log`;
      }
    } 
    else {
      this.bot.logger.error('Nino doesn\'t have permissions to publish to the mod log');
      return `Sorry ${punishment.options.moderator.username}, I was unable to post to the mod log due to me not having any permissions (\`Send Messages\`, \`Embed Links\`)`;
    }
  }

  async editModlog(_case: CaseModel, m: Message) {
    const action = this.determineType(_case.type);
    const member = await this.bot.client.getRESTUser(_case.victim)!;
    const moderator = await this.bot.client.getRESTUser(_case.moderator)!;
    await m.edit({
      embed: new EmbedBuilder()
        .setTitle(`Case #${_case.id} | ${member.username} has been ${_case.type + action.suffix}`)
        .setColor(action.color)
        .setDescription(stripIndents`
          **User**: ${member.username}#${member.discriminator} (ID: ${member.id})
          **Moderator**: ${moderator.username}#${moderator.discriminator} (ID: ${moderator.id})
          **Reason**: ${_case.reason}
        `).build()
    });
  }

  determineType(type: string): { color: number; suffix: string } {
    const action = {
      ban: 0xff0000,
      kick: 0xfff000,
      mute: 0xfff000,
      unban: 0xfff00,
      unmute: 0xfff00,
    }[type];
    let suffix;
    if (type === 'ban' || type === 'unban') suffix = 'ned';
    else if (type.endsWith('e')) suffix = 'd';
    else suffix = 'ed';

    return {
      color: action,
      suffix,
    };
  }
}