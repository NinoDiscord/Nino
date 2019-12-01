import Bot from '../Bot';
import { Member, TextChannel, Constants, User, Message, Guild } from 'eris';
import PermissionUtils from '../../util/PermissionUtils';
import EmbedBuilder from '../EmbedBuilder';
import { stripIndents } from 'common-tags';
import ms = require('ms');
import { CaseModel } from '../../models/CaseSchema';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
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
  punishmentPerms(punishment: Punishment): number {
    if (punishment.type === 'ban' || punishment.type === 'unban')
      return Constants.Permissions.banMembers;
    if (punishment.type === 'kick') return Constants.Permissions.kickMembers;
    if (
      punishment.type === 'role' ||
      punishment.type === 'unmute' ||
      punishment.type === 'unrole'
    )
      return Constants.Permissions.manageRoles;
    if (punishment.type === 'mute')
      return (
        Constants.Permissions.manageRoles | Constants.Permissions.manageChannels
      );
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
    if (!warnings) this.bot.warnings.create(member.guild.id, member.id);
    else
      await this.bot.warnings.update(member.guild.id, member.id, {
        amount: Math.min(warnings.amount + 1, 5),
      });
    const warns = Math.min(!!warnings ? warnings!.amount + 1 : 1, 5);

    let res: Punishment[] = [];
    for (let options of settings.punishments.filter(x => x.warnings === warns))
      res.push(
        new Punishment(
          options.type as PunishmentType,
          Object.assign({ moderator: me.user }, options)
        )
      );

    return res;
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
    if (!!warnings && amount > 0)
      await this.bot.warnings.update(member.guild.id, member.id, {
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
  async punish(
    member: Member | { id: string; guild: Guild },
    punishment: Punishment,
    reason?: string
  ) {
    const me = member.guild.members.get(this.bot.client.user.id)!;
    const guild = member.guild;

    const settings = await this.bot.settings.get(guild.id);

    if (
      (member instanceof Member && !PermissionUtils.above(me, member)) ||
      (me.permission.allow & this.punishmentPerms(punishment)) === 0
    )
      return;

    switch (punishment.type) {
      case 'ban':
        const days: number = punishment.options.days
          ? punishment.options.days
          : 7;
        const time = punishment.options.temp;
        const soft: boolean = !!punishment.options.soft;
        await guild.banMember(member.id, days, reason);
        if (soft) await guild.unbanMember(member.id, reason);
        else if (time !== undefined && time > 0)
          await this.bot.timeouts.addTimeout(
            member.id,
            member.guild,
            'unban',
            time!
          );
        break;
      case 'kick':
        if (!(member instanceof Member)) return;
        await member.kick(reason);
        break;
      case 'mute':
        if (!(member instanceof Member)) return;
        const temp = punishment.options.temp;
        let muterole = settings!.mutedRole;
        if (!muterole) {
          let muterole = guild.roles.find(x => x.name === 'muted');
          if (!muterole) {
            muterole = await guild.createRole(
              {
                name: 'muted',
                permissions: 0,
                mentionable: false,
                hoist: false,
              },
              'Creating muted role'
            );
            await muterole.editPosition(
              PermissionUtils.topRole(me)!.position - 1
            );
            for (let [id, channel] of guild.channels) {
              if (channel.permissionsOf(me.id).has('manageChannels'))
                await channel.editPermission(
                  muterole.id,
                  0,
                  Constants.Permissions.sendMessages,
                  'role',
                  'Overridding permissions for muted role'
                );
            }
          }
          settings!.mutedRole = muterole.id;
          settings!.save();
        }
        await member.addRole(muterole, reason);
        if (!!temp)
          this.bot.timeouts.addTimeout(member.id, guild, 'unmute', temp!);
        break;
      case 'role':
        if (!(member instanceof Member)) return;
        const role = member.guild.roles.get(punishment.options.roleid!);
        if (
          !!role &&
          !!PermissionUtils.topRole(me) &&
          PermissionUtils.topRole(me)!.position > role.position
        )
          await member.addRole(role.id, reason);
        break;
      case 'unmute':
        let mem: Member | { id: string; guild: Guild } | undefined = member;
        if (!(member instanceof Member)) mem = guild.members.get(mem.id);
        if (!mem) return;
        const muted = guild.roles.get(settings!.mutedRole);

        if (!!muted && !!(mem! as Member).roles.find(x => x === muted.id)) {
          await (mem! as Member).removeRole(muted.id, reason);
        }
        break;
      case 'unban':
        if (!guild.members.find(x => x.id === member.id))
          await guild.unbanMember(member.id, reason);
        break;
      case 'unrole':
        const srole = member.guild.roles.get(punishment.options.roleid!);
        if (
          member instanceof Member &&
          !!srole &&
          !!PermissionUtils.topRole(me) &&
          PermissionUtils.topRole(me)!.position > srole!.position
        )
          await member.removeRole(srole.id, reason);
        break;
    }
    if (punishment.type !== 'role' && punishment.type !== 'unrole') {
      if (member instanceof Member)
        this.postToModLog(member, punishment, reason);
      else {
        const user = await this.bot.client.getRESTUser(member.id);
        this.postToModLog(
          {
            username: user.username,
            discriminator: user.discriminator,
            guild: member.guild,
            id: member.id,
          },
          punishment,
          reason
        );
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
  async postToModLog(
    member:
      | Member
      | { guild: Guild; id: string; username: string; discriminator: string },
    punishment: Punishment,
    reason?: string
  ) {
    const settings = await this.bot.settings.get(member.guild.id);
    if (!settings || !settings!.modlog) return;
    const modlog = member.guild.channels.get(settings!.modlog) as TextChannel;
    if (
      !!modlog &&
      modlog!.permissionsOf(this.bot.client.user.id).has('sendMessages') &&
      modlog!.permissionsOf(this.bot.client.user.id).has('embedLinks')
    ) {
      const action = this.determineType(punishment.type);
      const c = await this.bot.cases.create(
        member.guild.id,
        punishment.options.moderator.id,
        punishment.type,
        member.id,
        reason
      );
      const message = await modlog.createMessage({
        embed: new EmbedBuilder()
          .setTitle(
            `Case #${c.id} **|** ${member.username} has been ${punishment.type +
              action.suffix}!`
          )
          .setDescription(
            stripIndents`
                        **User**: ${member.username}#${
              member.discriminator
            } (ID: ${member.id})
                        **Moderator**: ${
                          punishment.options.moderator.username
                        }#${punishment.options.moderator.discriminator} (ID: ${
              punishment.options.moderator.id
            })
                        **Reason**: ${reason || 'Unknown'}${
              !!punishment.options.soft ? '\n**Type**: Soft Ban' : ''
            }${
              !punishment.options.soft && !!punishment.options.temp
                ? `\n**Time**: ${ms(punishment.options.temp, { long: true })}`
                : ''
            }
                    `
          )
          .setColor(action.action)
          .build(),
      });
      await this.bot.cases.update(
        member.guild.id,
        c.id,
        { message: message.id },
        e => {
          if (!!e)
            this.bot.logger.log('error', `Couldn't update the case: ${e}`);
        }
      );
    }
  }

  async editModlog(_case: CaseModel, m: Message) {
    const action = this.determineType(_case.type);
    const member = await this.bot.client.getRESTUser(_case.victim)!;
    const moderator = await this.bot.client.getRESTUser(_case.moderator)!;
    await m.edit({
      embed: new EmbedBuilder()
        .setTitle(
          `Case #${_case.id} **|** ${member.username} has been ${_case.type +
            action.suffix}!`
        )
        .setDescription(
          stripIndents`
                    **User**: ${member.username}#${member.discriminator} (ID: ${member.id})
                    **Moderator**: ${moderator.username}#${moderator.discriminator} (ID: ${moderator.id})
                    **Reason**: ${_case.reason}
                `
        )
        .setColor(action.action)
        .build(),
    });
  }

  determineType(type: string): { action: number; suffix: string } {
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
      action,
      suffix,
    };
  }
}
