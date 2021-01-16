import { Client, Constants, Guild, Member, Message, Role, TextChannel, User } from 'eris';
import { inject, injectable } from 'inversify';
import { stripIndents } from 'common-tags';
import PermissionUtils from '../../util/PermissionUtils';
import { CaseModel } from '../../models/CaseSchema';
import EmbedBuilder from '../EmbedBuilder';
import { TYPES } from '../../types';
import Bot from '../Bot';
import 'reflect-metadata';
import CaseSettingsService from './settings/CaseSettingsService';
import WarningService from './WarningService';
import GuildSettingsService from './settings/GuildSettingsService';
import { GuildModel } from '../../models/GuildSchema';
import TimeoutsManager from '../managers/TimeoutsManager';
import ms = require('ms');
import { fetchGuild } from '../../util/DiscordUtils';
import { firstUpper } from '../../util';

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
  AddWarning = 'warning add',
  RemoveWarning = 'warning remove'
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
export default class PunishmentService {

  constructor(@inject(TYPES.Bot) private bot: Bot,
              @inject(TYPES.CaseSettingsService) private caseSettingsService: CaseSettingsService,
              @inject(TYPES.Client) private client: Client,
              @inject(TYPES.WarningService) private warningService: WarningService,
              @inject(TYPES.GuildSettingsService) private guildSettingsService: GuildSettingsService,
              @inject(TYPES.TimeoutsManager) private timeoutsManager: TimeoutsManager) {
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
    if (['warning add', 'warning remove'].includes(punishment.type)) return Constants.Permissions.kickMembers;

    return 0;
  }

  /**
   * Warns the user and punishes him according to the server's settings.
   * Returns the punishment for the amount of warnings he now has (if exists)
   * @param member the member to warn
   */
  async addWarning(
    member: Member, 
    mod: Member = member.guild.members.get(this.client.user.id)!, // some hack i guess
    reason?: string
  ): Promise<Punishment[]> {
    const me = member.guild.members.get(this.client.user.id)!;
    const settings = await this.guildSettingsService.get(member.guild.id);
    if (!settings) return [];

    const warnings = await this.warningService.getOrCreate(member.guild.id, member.id, reason);
    const newWarningCount = warnings.amount + 1;

    await this.warningService.update(member.guild.id, member.id, {
      amount: newWarningCount
    });

    const result = [
      new Punishment(PunishmentType.AddWarning, { moderator: mod.user })
    ];

    for (let options of settings.punishments.filter(x => x.warnings === newWarningCount)) {
      const punishment = new Punishment(options.type as PunishmentType, Object.assign({ moderator: me.user }, options));
      result.push(punishment);

      result.splice(0, 1); // remove the first item so it doesn't clash in
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
    let warnings = await this.warningService.get(member.guild.id, member.id);
    if (!!warnings && amount > 0) {
      await this.warningService.update(member.guild.id, member.id, {
        amount: Math.max(0, warnings.amount - amount),
      });
    }
  }

  private async resolveToMember(member: Member | { id: string; guild: Guild }) {
    let guild = member.guild;

    if (member instanceof Member) {
      return member;
    } else if (guild.members.has(member.id)) {
      return guild.members.get(member.id)!;
    } else {
      return await this.bot.client.getRESTGuildMember(guild.id, member.id);
    }
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
   * @param audit whether to audit the punishment or not
   */
  async punish(member: Member | { id: string; guild: Guild }, punishment: Punishment, reason?: string) {
    this.bot.logger.debug(`Called PunishmentService.punish(${member.id}, ${punishment.type}, ${reason || '<unknown>'})`);
    const me = member.guild.members.get(this.client.user.id)!;
    const guild = member.guild;
    const settings = await this.guildSettingsService.getOrCreate(guild.id);

    if (
      (member instanceof Member && !PermissionUtils.above(me, member)) ||
      (me.permissions.allow & this.getPermissions(punishment)) === 0
    ) return;

    switch (punishment.type) {
      case PunishmentType.Ban: {
        await this.applyBanPunishment(punishment, guild, member, reason);
      } break;

      case PunishmentType.Kick: {
        let mem = await this.resolveToMember(member);

        await mem.kick(reason ? encodeURIComponent(reason) : undefined);
      } break;

      case PunishmentType.Mute: {
        let mem = await this.resolveToMember(member);
        await this.applyMutePunishment(punishment, settings, guild, me, mem, reason);
      } break;

      case PunishmentType.AddRole: {
        if (!punishment.options.roleid) return;
        if (!guild.roles.has(punishment.options.roleid)) return;

        let mem = await this.resolveToMember(member);
        await this.applyAddRolePunishment(mem, punishment, me, reason);
      } break;

      case PunishmentType.Unmute: {
        if (!guild.members.has(member.id)) return;

        await this.applyUnmutePunishment(member, guild, settings, reason);
      } break;

      case PunishmentType.Unban: {
        const bans = await guild.getBans();

        if (bans.some(ban => ban.user.id === member.id)) 
          await guild.unbanMember(member.id, reason ? encodeURIComponent(reason) : undefined);
      } break;

      case PunishmentType.RemoveRole: {
        let mem = await this.resolveToMember(member);

        if (punishment.options.roleid === undefined) return;
        if (!mem.guild.roles.has(punishment.options.roleid)) return;

        await this.applyRemoveRolePunishment(mem, punishment, me, reason);
      } break;
    }

    if (punishment.type === PunishmentType.AddRole || punishment.type === PunishmentType.RemoveRole) return undefined;

    const user = await this.client.getRESTUser(member.id);
    const newCase = await this.createCase({
      username: user.username,
      discriminator: user.discriminator,
      guild: member.guild,
      id: member.id,
    }, punishment, reason, punishment.options.soft, punishment.options.temp);

    return this.postToModLog(newCase);
  }

  private async applyRemoveRolePunishment(mem: Member, punishment: Punishment, me: Member, reason: string | undefined) {
    const roleToRemove = mem.guild.roles.get(punishment.options.roleid!)!;

    if (reason) reason = encodeURIComponent(reason);
    if (PermissionUtils.above(me, mem) && PermissionUtils.roleAbove(PermissionUtils.topRole(me)!, roleToRemove)) {
      await mem.removeRole(roleToRemove.id, reason);
    }
  }

  private async applyUnmutePunishment(member: { id: string; guild: Guild } | Member, guild: Guild, settings: GuildModel, reason: string | undefined) {
    this.bot.logger.debug(`Called PunishmentService.applyUnmutePunishment(${member.id}, ${guild.id}, ${settings.guildID}, ${reason || '<unknown>'})`);
    
    const rest = await this.bot.client.getRESTGuildMember(member.guild.id, member.id);
    const muted = guild.roles.get(settings!.mutedRole)!;
    
    if (reason) reason = encodeURIComponent(reason);
    if (rest.roles.some(roleID => roleID === muted.id)) {
      await rest.removeRole(muted.id);
    }
  }

  private async applyAddRolePunishment(member: Member, punishment: Punishment, me: Member, reason: string | undefined) {
    const role = member.guild.roles.get(punishment.options.roleid!)!;
    
    if (reason) reason = encodeURIComponent(reason);
    if (PermissionUtils.topRole(me) !== undefined && PermissionUtils.topRole(me)!.position > role.position)
      await member.addRole(role.id, reason);
  }

  private async applyMutePunishment(punishment: Punishment, settings: GuildModel, guild: Guild, me: Member, member: Member, reason: string | undefined) {
    this.bot.logger.debug(`Called PunishmentManager.applyMutePunishment(${punishment.type}, ${settings.guildID}, ${me.id}, ${reason || '<no reason>'})`);
    const temp = punishment.options.temp;
    let mutedRole = await this.getOrCreateMutedRole(settings, guild, me);

    const id = mutedRole! instanceof Role ? mutedRole.id : mutedRole;
    if (reason) reason = encodeURIComponent(reason);
    if (!member.roles.includes(id)) {
      await member.addRole(id, reason);
      guild.members.update(member);
    }

    if (temp)
      await this.timeoutsManager.addTimeout(member.id, guild, 'unmute', temp!);
  }

  private async getOrCreateMutedRole(settings: GuildModel, guild: Guild, me: Member) {
    this.bot.logger.debug(`Called PunishmentManager.getOrCreateMutedRole(${settings.guildID}, ${guild.id}, ${me.id})`);
    let mutedRole: string | Role | undefined = settings!.mutedRole;
    if (mutedRole) return mutedRole;

    mutedRole = guild.roles.find(x => x.name === 'Muted');
    if (!mutedRole) {
      mutedRole = await guild.createRole({
        name: 'Muted',
        permissions: 0,
        mentionable: false,
        hoist: false
      }, '[Automod] Created "Muted" role');

      await this.addMutedRolePermissions(me, mutedRole, guild);
    }

    settings!.mutedRole = mutedRole.id;
    await settings!.save();

    return mutedRole;
  }

  private async addMutedRolePermissions(me: Member, mutedRole: Role, guild: Guild) {
    this.bot.logger.debug(`Called PunishmentManager.addMuteRolePermissions(${me.id}, ${mutedRole.id}, ${guild.id})`);
    const topRole = PermissionUtils.topRole(me)!;
    await mutedRole.editPosition(topRole.position - 1);

    for (let [, channel] of guild.channels) {
      const permissions = channel.permissionsOf(me.id);
      if (permissions.has('manageChannels'))
        await channel.editPermission(mutedRole.id, 0, Constants.Permissions.sendMessages, 'role', '[Automod] Override permissions for new Muted role.');
    }
  }

  private async applyBanPunishment(punishment: Punishment, guild: Guild, member: { id: string; guild: Guild }, reason: string | undefined) {
    const days = punishment.options.days ? punishment.options.days : 7;
    const time = punishment.options.temp;
    const soft = !!punishment.options.soft;

    if (reason) reason = encodeURIComponent(reason);
    await guild.banMember(member.id, days, reason);
    if (soft) await guild.unbanMember(member.id, reason);
    else if (typeof time === 'number' && time > 0) {
      await this.timeoutsManager.addTimeout(member.id, member.guild, 'unban', time!);
    }
  }

  async createCase(member: Member | { guild: Guild; id: string; username: string; discriminator: string }, punishment: Punishment, reason?: string, soft?: boolean, time?: number): Promise<CaseModel> {
    return this.caseSettingsService.create(member.guild.id, punishment.options.moderator.id, punishment.type, member.id, reason, soft, time);
  }

  /**
   * Posts a case to the mod-log
   *
   * @remarks
   *
   *
   * @param caseModel the case
   */
  async postToModLog(caseModel: CaseModel): Promise<string | undefined> {
    if (!this.client.guilds.has(caseModel.guild)) return;

    const settings = await this.guildSettingsService.get(caseModel.guild);
    const guild = await fetchGuild(this.client, caseModel.guild);
    const member = await this.client.getRESTUser(caseModel.victim);
    const moderator = await this.resolveToMember({ id: caseModel.moderator, guild: guild });
    const selfUser = this.client.user;
    const punishmentType = caseModel.type;

    if (!settings || !settings!.modlog) return;

    const modlog = guild.channels.get(settings!.modlog) as TextChannel;
    if (!modlog) return 'Mod-log channel has not been found';

    if (caseModel.message && modlog.messages.has(caseModel.message)) {
      await this.editModlog(caseModel, modlog.messages[caseModel.message]);
      return;
    }

    if (!modlog.permissionsOf(selfUser.id).has('sendMessages') || !modlog.permissionsOf(selfUser.id).has('embedLinks')) {
      this.bot.logger.error('Nino doesn\'t have permissions to publish to the mod log');
      return `Sorry ${moderator.username}, I was unable to post to the mod log due to me not having any permissions (\`Send Messages\`, \`Embed Links\`)`;
    }

    try {
      let embed = this.createModLogEmbed(member, moderator, settings, caseModel, punishmentType);

      const message = await modlog.createMessage({
        embed: embed
      });

      await this.caseSettingsService.update(guild.id, caseModel.id, {
        message: message.id
      }, error => error ? this.bot.logger.error(`Unable to update case:\n${error}`) : null);
      return undefined;
    } catch (ex) {
      this.bot.logger.error(`Unable to post to modlog:\n${ex}`);
      return `Sorry ${moderator.username}, I was unable to publish case #${caseModel.id} to the mod log`;
    }
  }

  async editModlog(caseModel: CaseModel, m: Message) {
    if (!this.client.guilds.has(caseModel.guild)) return;

    const guild = await fetchGuild(this.client, caseModel.guild);
    const member = await this.client.getRESTUser(caseModel.victim);
    const moderator = await this.resolveToMember({ id: caseModel.moderator, guild: guild });
    const settings = await this.guildSettingsService.getOrCreate(caseModel.guild);

    return m.edit({
      embed: this.createModLogEmbed(member, moderator, settings, caseModel, caseModel.type)
    });
  }

  private createModLogEmbed(member: User | Member, moderator: Member, settings: GuildModel, caseModel: CaseModel, punishmentType: string) {
    const action = this.determineType(punishmentType);
    let description = stripIndents`
        • **Victim**: ${member.username}#${member.discriminator} (${member.id})
        • **Moderator**: ${moderator.username}#${moderator.discriminator}
        • **Reason**: ${caseModel.reason || `Unknown (*edit the case with \`${settings!.prefix}reason ${caseModel.id} <reason>\`*)`}
      `;

    if (caseModel.soft) description += '\n• **Type**: Soft Ban';
    if (caseModel.time !== undefined) {
      const time = ms(caseModel.time, { long: true });
      description += `\n• **Time**: ${time}`;
    }

    return new EmbedBuilder()
      .setAuthor(`${firstUpper(punishmentType)} | Case #${caseModel.id}`, undefined, member.avatarURL)
      .setColor(action.color)
      .setDescription(description)
      .build();
  }

  determineType(type: string): { color: number; suffix: string } {
    const action = {
      ban: 0xCC5151,
      kick: 0xFFFF7F,
      mute: 0xFFFF7F,
      unban: 0x66B266,
      unmute: 0x66B266,
      ['warning add']: 0xFFFF7F,
      ['warning remove']: 0x66B266
    }[type];
    let suffix!: string;
    if (type === 'ban' || type === 'unban' || type === 'warning add') suffix = 'ned';
    else if (type.endsWith('e')) suffix = 'd';
    else suffix = 'ed';

    return {
      color: action,
      suffix,
    };
  }
}
