/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Constants, Guild, Member, User, VoiceChannel, TextChannel, Message, Attachment } from 'eris';
import { PunishmentType, Guild as NinoGuild, PrismaClient, Cases } from '.prisma/client';
import { Inject, Service } from '@augu/lilith';
import { EmbedBuilder } from '../structures';
import TimeoutsManager from '../components/timeouts/Timeouts';
import Permissions from '../util/Permissions';
import { Logger } from 'tslog';
import Database from '../components/Database';
import Discord from '../components/Discord';
import ms = require('ms');

type MemberLike = Member | { id: string; guild: Guild };

export enum PunishmentEntryType {
  WarningRemoved = 'Warning Removed',
  WarningAdded = 'Warning Added',
  VoiceUndeafen = 'Voice Undeafen',
  VoiceUnmute = 'Voice Unmute',
  VoiceMute = 'Voice Mute',
  VoiceDeaf = 'Voice Deafen',
  Unban = 'Unban',
  Unmuted = 'Unmuted',
  Muted = 'Muted',
  Kicked = 'Kicked',
  Banned = 'Banned',
}

interface ApplyPunishmentOptions {
  attachments?: Attachment[];
  moderator: User;
  publish?: boolean;
  reason?: string;
  member: MemberLike;
  soft?: boolean;
  time?: number;
  days?: number;
  type: PunishmentType;
}

interface PublishModLogOptions {
  warningsRemoved?: number | 'all';
  warningsAdded?: number;
  attachments?: string[];
  moderator: User;
  channel?: VoiceChannel;
  reason?: string | null;
  victim: User;
  guild: Guild;
  time?: number;
  type: PunishmentEntryType;
}

interface ApplyGenericMuteOptions extends ApplyActionOptions {
  moderator: User;
  settings: NinoGuild;
}

interface ApplyActionOptions {
  reason?: string;
  member: Member;
  guild: Guild;
  time?: number;
  self: Member;
}

interface ApplyGenericVoiceAction extends Exclude<ApplyActionOptions, 'guild' | 'time' | 'self'> {
  statement: PublishModLogOptions;
  moderator: User;
}

interface ApplyBanActionOptions extends ApplyActionOptions {
  moderator: User;
  soft: boolean;
  days: number;
}

function stringifyDBType(type: PunishmentType): PunishmentEntryType | null {
  switch (type) {
    case PunishmentType.VOICE_UNDEAFEN:
      return PunishmentEntryType.VoiceUndeafen;
    case PunishmentType.VOICE_UNMUTE:
      return PunishmentEntryType.VoiceUnmute;
    case PunishmentType.VOICE_DEAFEN:
      return PunishmentEntryType.VoiceDeaf;
    case PunishmentType.VOICE_MUTE:
      return PunishmentEntryType.VoiceMute;
    case PunishmentType.UNMUTE:
      return PunishmentEntryType.Unmuted;
    case PunishmentType.UNBAN:
      return PunishmentEntryType.Unban;
    case PunishmentType.MUTE:
      return PunishmentEntryType.Muted;
    case PunishmentType.KICK:
      return PunishmentEntryType.Kicked;
    case PunishmentType.BAN:
      return PunishmentEntryType.Banned;

    default:
      return null; // shouldn't come here but oh well
  }
}

const emojis: { [P in PunishmentEntryType]: string } = {
  [PunishmentEntryType.WarningRemoved]: ':pencil:',
  [PunishmentEntryType.VoiceUndeafen]: ':speaking_head:',
  [PunishmentEntryType.WarningAdded]: ':pencil:',
  [PunishmentEntryType.VoiceUnmute]: ':loudspeaker:',
  [PunishmentEntryType.VoiceMute]: ':mute:',
  [PunishmentEntryType.VoiceDeaf]: ':mute:',
  [PunishmentEntryType.Unmuted]: ':loudspeaker:',
  [PunishmentEntryType.Kicked]: ':boot:',
  [PunishmentEntryType.Banned]: ':hammer:',
  [PunishmentEntryType.Unban]: ':bust_in_silhouette:',
  [PunishmentEntryType.Muted]: ':mute:',
};

@Service({
  priority: 1,
  name: 'punishments',
})
export default class PunishmentService {
  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Inject
  private readonly prisma!: PrismaClient;

  @Inject
  private readonly logger!: Logger;

  private async resolveMember(member: MemberLike, rest: boolean = true) {
    return member instanceof Member
      ? member
      : member.guild.members.has(member.id)
      ? member.guild.members.get(member.id)!
      : rest
      ? await this.discord.client
          .getRESTGuildMember(member.guild.id, member.id)
          .catch(() => new Member({ id: member.id }, member.guild, this.discord.client))
      : new Member({ id: member.id }, member.guild, this.discord.client);
  }

  get timeouts(): TimeoutsManager {
    return app.$ref(TimeoutsManager);
  }

  permissionsFor(type: PunishmentType) {
    switch (type) {
      case PunishmentType.UNMUTE:
      case PunishmentType.UNBAN:
        return Constants.Permissions.manageRoles;

      case PunishmentType.VOICE_UNDEAFEN:
      case PunishmentType.VOICE_DEAFEN:
        return Constants.Permissions.voiceDeafenMembers;

      case PunishmentType.VOICE_UNMUTE:
      case PunishmentType.VOICE_MUTE:
        return Constants.Permissions.voiceMuteMembers;

      // what the fuck eslint
      case PunishmentType.UNBAN: // eslint-disable-line
      case PunishmentType.BAN:
        return Constants.Permissions.banMembers;

      case PunishmentType.KICK:
        return Constants.Permissions.kickMembers;

      default:
        return 0n;
    }
  }

  async createWarning(member: Member, reason?: string, amount?: number) {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.prisma.warning.findMany({
      where: {
        guildId: member.guild.id,
        userId: member.user.id,
      },
    });

    const current = warnings.reduce((acc, curr) => acc + curr.amount, 0);
    const count = amount !== undefined ? current + amount : current + 1;

    if (count < 0) throw new RangeError('amount out of bounds');

    const punishments = await this.prisma.punishments.findMany({
      where: {
        guildId: member.guild.id,
      },
    });

    const results = punishments.filter((x) => x.warnings === count);

    await this.prisma.warning.create({
      data: {
        guildId: member.guild.id,
        reason,
        amount: amount ?? 1,
        userId: member.id,
      },
    });

    // run the actual punishments
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      await this.apply({
        moderator: this.discord.client.users.get(this.discord.client.user.id)!,
        publish: false,
        member,
        type: result.type,
      });
    }

    // get case index
    const newest = await this.prisma.cases.findMany({
      where: {
        guildId: member.guild.id,
      },
      orderBy: {
        index: 'asc',
      },
    });

    console.log(newest);

    const index = newest[0] !== undefined ? newest[0].index + 1 : 1;
    const model = await this.prisma.cases.create({
      data: {
        attachments: [],
        moderatorId: this.discord.client.user.id,
        victimId: member.id,
        guildId: member.guild.id,
        reason,
        index,
        type: PunishmentType.WARNING_ADDED,
        soft: false,
      },
    });

    return results.length > 0
      ? Promise.resolve()
      : this.publishToModLog(
          {
            warningsAdded: amount ?? 1,
            moderator: self.user,
            reason,
            victim: member.user,
            guild: member.guild,
            type: PunishmentEntryType.WarningAdded,
          },
          model
        );
  }

  async removeWarning(member: Member, reason?: string, amount?: number | 'all') {
    const self = member.guild.members.get(this.discord.client.user.id)!;
    const warnings = await this.database.warnings.getAll(member.guild.id, member.id);

    if (warnings.length === 0) throw new SyntaxError("user doesn't have any punishments to be removed");

    const count = warnings.reduce((acc, curr) => acc + curr.amount, 0);
    if (amount === 'all') {
      await this.database.warnings.clean(member.guild.id, member.id);

      // get case index
      const newest = await this.prisma.cases.findMany({
        where: {
          guildId: member.guild.id,
        },
        orderBy: {
          index: 'asc',
        },
      });

      console.log(newest);

      const index = newest[0] !== undefined ? newest[0].index + 1 : 1;
      const model = await this.prisma.cases.create({
        data: {
          attachments: [],
          moderatorId: this.discord.client.user.id,
          victimId: member.id,
          guildId: member.guild.id,
          reason,
          index,
          type: PunishmentType.WARNING_REMOVED,
          soft: false,
        },
      });

      return this.publishToModLog(
        {
          warningsRemoved: 'all',
          moderator: self.user,
          victim: member.user,
          reason,
          guild: member.guild,
          type: PunishmentEntryType.WarningRemoved,
        },
        model
      );
    } else {
      // get case index
      const newest = await this.prisma.cases.findMany({
        where: {
          guildId: member.guild.id,
        },
        orderBy: {
          index: 'asc',
        },
      });

      console.log(newest);

      const index = newest[0] !== undefined ? newest[0].index + 1 : 1;
      const model = await this.prisma.cases.create({
        data: {
          attachments: [],
          moderatorId: this.discord.client.user.id,
          victimId: member.id,
          guildId: member.guild.id,
          reason,
          index,
          type: PunishmentType.WARNING_REMOVED,
          soft: false,
        },
      });

      await this.prisma.warning.create({
        data: {
          guildId: member.guild.id,
          userId: member.user.id,
          amount: -1,
          reason,
        },
      });

      return this.publishToModLog(
        {
          warningsRemoved: count,
          moderator: self.user,
          victim: member.user,
          reason,
          guild: member.guild,
          type: PunishmentEntryType.WarningRemoved,
        },
        model
      );
    }
  }

  async apply({ attachments, moderator, publish, reason, member, soft, type, days, time }: ApplyPunishmentOptions) {
    this.logger.info(
      `Told to apply punishment ${type} on member ${member.id}${reason ? `, with reason: ${reason}` : ''}${
        publish ? ', publishing to modlog!' : ''
      }`
    );

    const settings = await this.prisma.guild.findFirst({
      where: {
        guildId: member.guild.id,
      },
    });

    const self = member.guild.members.get(this.discord.client.user.id)!;

    if (
      (member instanceof Member && !Permissions.isMemberAbove(self, member)) ||
      (BigInt(self.permissions.allow) & this.permissionsFor(type)) === 0n
    )
      return;

    let user!: Member;
    if (type === PunishmentType.UNBAN || (type === PunishmentType.BAN && member.guild.members.has(member.id))) {
      user = await this.resolveMember(member, false);
    } else {
      user = await this.resolveMember(member, true);
    }

    const modlogStatement: PublishModLogOptions = {
      attachments: attachments?.map((s) => s.url) ?? [],
      moderator,
      reason,
      victim: user.user,
      guild: member.guild,
      type: stringifyDBType(type)!,
      time,
    };

    switch (type) {
      case PunishmentType.BAN:
        await this.applyBan({
          moderator,
          member: user,
          reason,
          guild: member.guild,
          self,
          days: days ?? 7,
          soft: soft === true,
          time,
        });
        break;

      case PunishmentType.KICK:
        await user.kick(reason ? encodeURIComponent(reason) : 'No reason was specified.');
        break;

      case PunishmentType.MUTE:
        await this.applyMute({
          moderator,
          settings: settings!, // cannot be null :3
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.UNBAN:
        await member.guild.unbanMember(member.id, reason ? encodeURIComponent(reason) : 'No reason was specified.');
        break;

      case PunishmentType.UNMUTE:
        await this.applyUnmute({
          moderator,
          settings: settings!,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VOICE_MUTE:
        await this.applyVoiceMute({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VOICE_DEAFEN:
        await this.applyVoiceDeafen({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
          time,
        });

        break;

      case PunishmentType.VOICE_UNMUTE:
        await this.applyVoiceUnmute({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
        });

        break;

      case PunishmentType.VOICE_UNDEAFEN:
        await this.applyVoiceUndeafen({
          moderator,
          statement: modlogStatement,
          member: user,
          reason,
          guild: member.guild,
          self,
        });

        break;
    }

    // get case index
    const newest = await this.prisma.cases.findMany({
      where: {
        guildId: member.guild.id,
      },
      orderBy: {
        index: 'asc',
      },
    });

    console.log(newest);

    const index = newest[0] !== undefined ? newest[0].index + 1 : 1;
    const model = await this.prisma.cases.create({
      data: {
        attachments: attachments?.slice(0, 5).map((v) => v.url) ?? [],
        moderatorId: moderator.id,
        victimId: member.id,
        guildId: member.guild.id,
        reason,
        index,
        soft: soft === true,
        time,
        type,
      },
    });

    if (publish) {
      await this.publishToModLog(modlogStatement, model);
    }
  }

  private async applyBan({ moderator, reason, member, guild, days, soft, time }: ApplyBanActionOptions) {
    await guild.banMember(member.id, days, reason);
    if (soft) await guild.unbanMember(member.id, reason);
    if (!soft && time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.UNBAN,
        time,
      });
    }
  }

  private async applyUnmute({ settings, reason, member, guild }: ApplyGenericMuteOptions) {
    const role = guild.roles.get(settings.mutedRoleId!)!;
    if (member.roles.includes(role.id))
      await member.removeRole(role.id, reason ? encodeURIComponent(reason) : 'No reason was specified.');
  }

  private async applyMute({ moderator, settings, reason, member, guild, time }: ApplyGenericMuteOptions) {
    const roleID = await this.getOrCreateMutedRole(guild, settings);

    if (reason) reason = encodeURIComponent(reason);
    if (!member.roles.includes(roleID)) {
      await member.addRole(roleID, reason ?? 'No reason was specified.');
    }

    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.UNMUTE,
        time,
      });
    }
  }

  private async applyVoiceMute({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState.channelID !== null && !member.voiceState.mute)
      await member.edit({ mute: true }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VOICE_UNMUTE,
        time,
      });
    }
  }

  private async applyVoiceDeafen({ moderator, reason, member, guild, statement, time }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState.channelID !== null && !member.voiceState.deaf)
      await member.edit({ deaf: true }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
    if (time !== undefined && time > 0) {
      if (this.timeouts.state !== 'connected')
        this.logger.warn('Timeouts service is not connected! Will relay once done...');

      await this.timeouts.apply({
        moderator: moderator.id,
        victim: member.id,
        guild: guild.id,
        type: PunishmentType.VOICE_UNDEAFEN,
        time,
      });
    }
  }

  private async applyVoiceUnmute({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.mute)
      await member.edit({ mute: false }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
  }

  private async applyVoiceUndeafen({ reason, member, statement }: ApplyGenericVoiceAction) {
    if (reason) reason = encodeURIComponent(reason);
    if (member.voiceState !== undefined && member.voiceState.deaf)
      await member.edit({ deaf: false }, reason ?? 'No reason was specified.');

    statement.channel = (await this.discord.client.getRESTChannel(member.voiceState.channelID!)) as VoiceChannel;
  }

  private async publishToModLog(
    {
      warningsRemoved,
      warningsAdded,
      moderator,
      attachments,
      channel,
      reason,
      victim,
      guild,
      time,
      type,
    }: PublishModLogOptions,
    caseModel: Cases
  ) {
    const settings = await this.database.guilds.get(guild.id);
    if (!settings.modlogChannelID) return;

    const modlog = guild.channels.get(settings.modlogChannelID) as TextChannel;
    if (!modlog) return;

    if (
      !modlog.permissionsOf(this.discord.client.user.id).has('sendMessages') ||
      !modlog.permissionsOf(this.discord.client.user.id).has('embedLinks')
    )
      return;

    const embed = this.getModLogEmbed(caseModel.index, {
      attachments,
      warningsRemoved,
      warningsAdded,
      moderator,
      channel,
      reason,
      victim,
      guild,
      time,
      type: stringifyDBType(caseModel.type)!,
    }).build();
    const content = `**[** ${emojis[type] ?? ':question:'} **~** Case #**${caseModel.index}** (${type}) ]`;
    const message = await modlog.createMessage({
      embed,
      content,
    });

    await this.database.cases.update(guild.id, caseModel.index, {
      messageID: message.id,
    });
  }

  async editModLog(model: Cases, message: Message) {
    const warningRemovedField = message.embeds[0].fields?.find((field) => field.name.includes('Warnings Removed'));
    const warningsAddField = message.embeds[0].fields?.find((field) => field.name.includes('Warnings Added'));

    const obj: Record<string, any> = {};
    if (warningsAddField !== undefined) obj.warningsAdded = Number(warningsAddField.value);

    if (warningRemovedField !== undefined)
      obj.warningsRemoved = warningRemovedField.value === 'All' ? 'All' : Number(warningRemovedField.value);

    return message.edit({
      content: `**[** ${emojis[stringifyDBType(model.type)!] ?? ':question:'} ~ Case #**${model.index}** (${
        stringifyDBType(model.type) ?? '... unknown ...'
      }) **]**`,
      embed: this.getModLogEmbed(model.index, {
        moderator: this.discord.client.users.get(model.moderatorId)!,
        victim: this.discord.client.users.get(model.victimId)!,
        reason: model.reason,
        guild: this.discord.client.guilds.get(model.guildId)!,
        time: model.time !== undefined ? Number(model.time) : undefined,
        type: stringifyDBType(model.type)!,

        ...obj,
      }).build(),
    });
  }

  private async getOrCreateMutedRole(guild: Guild, settings: NinoGuild) {
    let muteRole = settings.mutedRoleId;
    if (muteRole) return muteRole;

    let role = guild.roles.find((x) => x.name.toLowerCase() === 'muted');
    if (!role) {
      role = await guild.createRole(
        {
          mentionable: false,
          permissions: 0,
          hoist: false,
          name: 'Muted',
        },
        `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Created "Muted" role`
      );

      muteRole = role.id;

      const topRole = Permissions.getTopRole(guild.members.get(this.discord.client.user.id)!);
      if (topRole !== undefined) {
        await role.editPosition(topRole.position - 1);
        for (const channel of guild.channels.values()) {
          const permissions = channel.permissionsOf(this.discord.client.user.id);
          if (permissions.has('manageChannels'))
            await channel.editPermission(
              /* overwriteID */ role.id,
              /* allowed */ 0,
              /* denied */ Constants.Permissions.sendMessages,
              /* type */ 0,
              /* reason */ `[${this.discord.client.user.username}#${this.discord.client.user.discriminator}] Overrided permissions for new Muted role`
            );
        }
      }
    }

    await this.database.guilds.update(guild.id, { mutedRoleID: role.id });
    return role.id;
  }

  getModLogEmbed(
    caseID: number,
    { warningsRemoved, warningsAdded, attachments, moderator, channel, reason, victim, time }: PublishModLogOptions
  ) {
    const embed = new EmbedBuilder()
      .setColor(0xdaa2c6)
      .setAuthor(
        `${victim.username}#${victim.discriminator} (${victim.id})`,
        undefined,
        victim.dynamicAvatarURL('png', 1024)
      )
      .addField('• Moderator', `${moderator.username}#${moderator.discriminator} (${moderator.id})`, true);

    const _reason =
      reason !== undefined
        ? Array.isArray(reason)
          ? reason.join(' ')
          : reason
        : `
      • No reason was provided. Use \`reason ${caseID} <reason>\` to update it!
    `;

    const _attachments = attachments?.map((url, index) => `• [**\`Attachment #${index}\`**](${url})`).join('\n') ?? '';

    embed.setDescription([_reason ?? '', _attachments]);

    if (warningsRemoved !== undefined)
      embed.addField('• Warnings Removed', warningsRemoved === 'all' ? 'All' : warningsRemoved.toString(), true);

    if (warningsAdded !== undefined) embed.addField('• Warnings Added', warningsAdded.toString(), true);

    if (channel !== undefined) embed.addField('• Voice Channel', `${channel.name} (${channel.id})`, true);

    if (time !== undefined || time !== null) {
      try {
        embed.addField('• Time', ms(time!, { long: true }), true);
      } catch {
        // ignore since fuck you
      }
    }

    return embed;
  }
}
