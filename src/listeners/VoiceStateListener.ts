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

import type { Member, TextChannel, VoiceChannel } from 'eris';
import { Inject, LinkParent } from '@augu/lilith';
import { LoggingEvents } from '../entities/LoggingEntity';
import ListenerService from '../services/ListenerService';
import Subscribe from '../structures/decorators/Subscribe';
import Database from '../components/Database';
import Discord from '../components/Discord';

@LinkParent(ListenerService)
export default class VoiceStateListener {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  @Subscribe('voiceChannelJoin')
  async onVoiceChannelJoin(member: Member, voice: VoiceChannel) {
    const settings = await this.database.logging.get(member.guild.id);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.VoiceChannelJoin))
      return;

    const channel = settings.channelID !== undefined ? await this.discord.getChannel<TextChannel>(settings.channelID) : null;
    if (
      channel === null ||
      !member.guild.channels.has(settings.channelID!) ||
      !member.guild.channels.get(settings.channelID!)!.permissionsOf(this.discord.client.user.id).has('sendMessages')
    ) return;

    return channel.createMessage(`:loudspeaker: **${member.user.username}#${member.user.discriminator}** (${member.user.id}) has joined channel **${voice.name}** with ${voice.voiceMembers.size} members.`);
  }

  @Subscribe('voiceChannelLeave')
  async onVoiceChannelLeave(member: Member, voice: VoiceChannel) {
    const settings = await this.database.logging.get(member.guild.id);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.VoiceChannelJoin))
      return;

    const channel = settings.channelID !== undefined ? await this.discord.getChannel<TextChannel>(settings.channelID) : null;
    if (
      channel === null ||
      !member.guild.channels.has(settings.channelID!) ||
      !member.guild.channels.get(settings.channelID!)!.permissionsOf(this.discord.client.user.id).has('sendMessages')
    ) return;

    return channel.createMessage(`:bust_in_silhouette: **${member.username}#${member.discriminator}** (${member.id}) has left channel **${voice.name}**`);
  }

  @Subscribe('voiceChannelSwitch')
  async onVoiceChannelSwitch(member: Member, voice: VoiceChannel, old: VoiceChannel) {
    const settings = await this.database.logging.get(member.guild.id);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.VoiceChannelJoin))
      return;

    const channel = settings.channelID !== undefined ? await this.discord.getChannel<TextChannel>(settings.channelID) : null;
    if (
      channel === null ||
      !member.guild.channels.has(settings.channelID!) ||
      !member.guild.channels.get(settings.channelID!)!.permissionsOf(this.discord.client.user.id).has('sendMessages')
    ) return;

    return channel.createMessage(`:radio_button: **${member.username}#${member.discriminator}** (${member.id}) has switch from channel ${old.name} to ${voice.name}.`);
  }
}
