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

import { DiscordRESTError, Member, User, VoiceChannel } from 'eris';
import { Command, CommandMessage, Subcommand } from '../../../structures';
import { PunishmentType } from '../../../entities/PunishmentsEntity';
import PunishmentService from '../../../services/PunishmentService';
import { Categories, CHANNEL_REGEX } from '../../../util/Constants';
import Permissions from '../../../util/Permissions';
import { Inject } from '@augu/lilith';
import Discord from '../../../components/Discord';
import ms = require('ms');

const condition = (discord: Discord, member: Member) =>
  member.user.id !== discord.client.user.id && // If it's not Nino
  member.guild.ownerID === member.user.id && // If the owner is in the voice channel
  member.permissions.has('voiceMuteMembers'); // If the member is a voice moderator

const botCondition = (discord: Discord, member: Member) =>
  member.user.id !== discord.client.user.id && // If it's not Nino
  member.bot === true; // If it's a bot

export default class VoiceKickCommand extends Command {
  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      userPermissions: 'voiceMoveMembers',
      description: 'descriptions.voice_kick',
      category: Categories.Moderation,
      examples: [
        'vckick | Kick all members in your voice channel',
        'vckick <#521254554543485646> | Kick all members in a specific channel',
        'vckick bots | Kick all bots in your voice channel',
        'vckick bots <#521254554543485646> | Kick all bots in a specific channel',
      ],
      aliases: ['kickvc'],
      name: 'vckick',
    });
  }

  async run(msg: CommandMessage, [channelOrAmount]: [string?]) {
    if (!channelOrAmount) {
      const message = await msg.reply('Kicking all members...');
      if (!msg.member.voiceState.channelID)
        return msg.reply('You must be in a voice channel.');

      const id = msg.member.voiceState.channelID; // cache it if they decide to leave
      const voiceChan = await this.discord.getChannel<VoiceChannel>(id);
      if (voiceChan === null)
        return msg.error("Unknown voice channel you're in.");

      if (
        !voiceChan
          .permissionsOf(this.discord.client.user.id)
          .has('voiceConnect') ||
        !voiceChan
          .permissionsOf(this.discord.client.user.id)
          .has('voiceMoveMembers')
      )
        return msg.reply(
          'I do not have permissions to **Connect** or **Move Members**.'
        );

      const members = voiceChan.voiceMembers.filter((c) =>
        condition(this.discord, c)
      );
      if (members.length === 0)
        return msg.error(
          'No users were in this channel. (excluding myself, the owner, and people with **`Voice Mute Members`** permission)'
        );

      if (members.length === 1) {
        await this.discord.client.joinVoiceChannel(id);
        try {
          await members[0].edit(
            { channelID: null },
            encodeURIComponent(
              `[Voice Kick] Told to kick ${members[0].username}#${members[0].discriminator} (${members[0].id})`
            )
          );
        } catch {
          return msg.error(
            `Unable to kick **${members[0].username}#${members[0].discriminator}**.`
          );
        }
      }

      await this.discord.client.joinVoiceChannel(id);
      await message.edit(`ℹ️ **Removing ${members.length} members...**`);

      let success = 0;
      let errored = 0;
      for (const member of members) {
        try {
          success++;
          await member.edit(
            { channelID: null },
            encodeURIComponent(
              `[Voice Kick] Told to kick ${member.username}#${member.discriminator} (${member.id})`
            )
          );
        } catch {
          errored++;
        }
      }

      const errorRate = ((errored / members.length) * 100).toFixed(2);
      const successRate = ((success / members.length) * 100).toFixed(2);
      this.discord.client.leaveVoiceChannel(id);

      await message.delete();
      return msg.reply(
        [
          `Successfully kicked **${success}/${members.length}** members.`,
          '',
          `> ${msg.successEmote} **Success Rate**: ${successRate}%`,
          `> ${msg.errorEmote} **Error Rate**: ${errorRate}%`,
        ].join('\n')
      );
    }

    const channel = await this.discord.getChannel<VoiceChannel>(
      channelOrAmount
    );

    // if I can recall correctly, IDs are around 15-21 but I could be wrong.
    //     ~ Noel
    if (channel === null)
      return msg.reply(`Channel with ID **${channelOrAmount}** was not found.`);

    if (channel.type !== 2)
      return msg.reply('Channel was not a voice channel.');

    if (
      !channel.permissionsOf(this.discord.client.user.id).has('voiceConnect') ||
      !channel
        .permissionsOf(this.discord.client.user.id)
        .has('voiceMoveMembers')
    )
      return msg.reply(
        'I do not have permissions to **Connect** or **Move Members**.'
      );

    const members = channel.voiceMembers.filter((c) =>
      condition(this.discord, c)
    );
    if (members.length === 0)
      return msg.error(
        'No users were in this channel. (excluding myself, the owner, and people with **`Voice Mute Members`** permission)'
      );

    if (members.length === 1) {
      await this.discord.client.joinVoiceChannel(channel.id);
      try {
        await members[0].edit(
          { channelID: null },
          encodeURIComponent(
            `[Voice Kick] Told to kick ${members[0].username}#${members[0].discriminator} (${members[0].id})`
          )
        );
      } catch {
        return msg.error(
          `Unable to kick **${members[0].username}#${members[0].discriminator}**.`
        );
      }
    }

    const message = await msg.reply(
      `ℹ️ Kicking all members in <#${channel.id}> (${members.length} members)`
    );
    await this.discord.client.joinVoiceChannel(channel.id);

    let success = 0;
    let errored = 0;
    for (const member of members) {
      try {
        success++;
        await member.edit(
          { channelID: null },
          encodeURIComponent(
            `[Voice Kick] Told to kick ${member.username}#${member.discriminator} (${member.id})`
          )
        );
      } catch {
        errored++;
      }
    }

    const errorRate = ((errored / members.length) * 100).toFixed(2);
    const successRate = ((success / members.length) * 100).toFixed(2);
    this.discord.client.leaveVoiceChannel(channel.id);

    await message.delete();
    return msg.reply(
      [
        `Successfully kicked **${success}/${members.length}** members.`,
        '',
        `> ${msg.successEmote} **Success Rate**: ${successRate}%`,
        `> ${msg.errorEmote} **Error Rate**: ${errorRate}%`,
      ].join('\n')
    );
  }

  @Subcommand('<channel | amount>')
  async bots(msg: CommandMessage, [channelOrAmount]: [string?]) {
    if (!channelOrAmount) {
      const message = await msg.reply('Kicking all bots...');
      if (!msg.member.voiceState.channelID)
        return msg.reply('You must be in a voice channel.');

      const id = msg.member.voiceState.channelID; // cache it if they decide to leave
      const voiceChan = await this.discord.getChannel<VoiceChannel>(id);
      if (voiceChan === null)
        return msg.error("Unknown voice channel you're in.");

      if (
        !voiceChan
          .permissionsOf(this.discord.client.user.id)
          .has('voiceConnect') ||
        !voiceChan
          .permissionsOf(this.discord.client.user.id)
          .has('voiceMoveMembers')
      )
        return msg.reply(
          'I do not have permissions to **Connect** or **Move Members**.'
        );

      const members = voiceChan.voiceMembers.filter((c) =>
        botCondition(this.discord, c)
      );
      if (members.length === 0)
        return msg.error('No bots were in this channel. (excluding myself)');

      if (members.length === 1) {
        await this.discord.client.joinVoiceChannel(id);
        try {
          await members[0].edit(
            { channelID: null },
            encodeURIComponent(
              `[Voice Kick] Told to kick ${members[0].username}#${members[0].discriminator} (${members[0].id})`
            )
          );
        } catch {
          return msg.error(
            `Unable to kick bot **${members[0].username}#${members[0].discriminator}**.`
          );
        }
      }

      await this.discord.client.joinVoiceChannel(id);
      await message.edit(`ℹ️ **Removing ${members.length} bots...**`);

      let success = 0;
      let errored = 0;
      for (const member of members) {
        try {
          success++;
          await member.edit(
            { channelID: null },
            encodeURIComponent(
              `[Voice Kick] Told to kick ${member.username}#${member.discriminator} (${member.id})`
            )
          );
        } catch {
          errored++;
        }
      }

      const errorRate = ((errored / members.length) * 100).toFixed(2);
      const successRate = ((success / members.length) * 100).toFixed(2);
      this.discord.client.leaveVoiceChannel(id);

      await message.delete();
      return msg.reply(
        [
          `Successfully kicked **${success}/${members.length}** bots.`,
          '',
          `> ${msg.successEmote} **Success Rate**: ${successRate}%`,
          `> ${msg.errorEmote} **Error Rate**: ${errorRate}%`,
        ].join('\n')
      );
    }

    const channel = await this.discord.getChannel<VoiceChannel>(
      channelOrAmount
    );

    // if I can recall correctly, IDs are around 15-21 but I could be wrong.
    //     ~ Noel
    if (channel === null)
      return msg.reply(`Channel with ID **${channelOrAmount}** was not found.`);

    if (channel.type !== 2)
      return msg.reply('Channel was not a voice channel.');

    if (
      !channel.permissionsOf(this.discord.client.user.id).has('voiceConnect') ||
      !channel
        .permissionsOf(this.discord.client.user.id)
        .has('voiceMoveMembers')
    )
      return msg.reply(
        'I do not have permissions to **Connect** or **Move Members**.'
      );

    const members = channel.voiceMembers.filter((c) =>
      botCondition(this.discord, c)
    );
    if (members.length === 0)
      return msg.error(
        'No users were in this channel. (excluding myself, the owner, and people with **`Voice Mute Members`** permission)'
      );

    if (members.length === 1) {
      await this.discord.client.joinVoiceChannel(channel.id);
      try {
        await members[0].edit(
          { channelID: null },
          encodeURIComponent(
            `[Voice Kick] Told to kick ${members[0].username}#${members[0].discriminator} (${members[0].id})`
          )
        );
      } catch {
        return msg.error(
          `Unable to kick **${members[0].username}#${members[0].discriminator}**.`
        );
      }
    }

    const message = await msg.reply(
      `ℹ️ Kicking all members in <#${channel.id}> (${members.length} members)`
    );
    await this.discord.client.joinVoiceChannel(channel.id);

    let success = 0;
    let errored = 0;
    for (const member of members) {
      try {
        success++;
        await member.edit(
          { channelID: null },
          encodeURIComponent(
            `[Voice Kick] Told to kick ${member.username}#${member.discriminator} (${member.id})`
          )
        );
      } catch {
        errored++;
      }
    }

    const errorRate = ((errored / members.length) * 100).toFixed(2);
    const successRate = ((success / members.length) * 100).toFixed(2);
    this.discord.client.leaveVoiceChannel(channel.id);

    await message.delete();
    return msg.reply(
      [
        `Successfully kicked **${success}/${members.length}** members.`,
        '',
        `> ${msg.successEmote} **Success Rate**: ${successRate}%`,
        `> ${msg.errorEmote} **Error Rate**: ${errorRate}%`,
      ].join('\n')
    );
  }
}
