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
import { Command, CommandMessage } from '../../../structures';
import { PunishmentType } from '../../../entities/PunishmentsEntity';
import PunishmentService from '../../../services/PunishmentService';
import { Categories } from '../../../util/Constants';
import Permissions from '../../../util/Permissions';
import { Inject } from '@augu/lilith';
import Discord from '../../../components/Discord';
import ms = require('ms');

export default class VoiceMuteCommand extends Command {
  @Inject
  private readonly punishments!: PunishmentService;

  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.voice_mute',
      category: Categories.Moderation,
      examples: [
        'vcmute <@256548545856545896>',
        'vcmute 3',
        'vcmute 3 some reason!',
        'vcmute 3 some reason! | 3d'
      ],
      aliases: ['mutevc'],
      name: 'vcmute'
    });
  }

  async run(msg: CommandMessage, [userID, ...reason]: string[]) {
    if (!userID)
      return msg.reply('No bot or user was specified.');

    let user!: User | null;
    try {
      user = await this.discord.getUser(userID);
    } catch(ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10013)
        return msg.reply(`User or bot with ID "${userID}" was not found. (assuming it's a deleted bot or user)`);

      return msg.reply([
        'Uh-oh! An internal error has occured while running this.',
        'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
        '',
        '```js',
        ex.stack ?? '<... no stacktrace? ...>',
        '```'
      ].join('\n'));
    }

    if (user === null)
      return msg.reply('Bot or user was not found.');

    const member = msg.guild.members.get(user.id) ?? { id: user.id, guild: msg.guild };
    if (member.id === msg.guild.ownerID)
      return msg.reply('I don\'t think I can perform this action due to you banning the owner, you idiot.');

    if (member instanceof Member) {
      if (member.permissions.has('administrator') || member.permissions.has('banMembers'))
        return msg.reply(`I can't perform this action due to **${user.username}#${user.discriminator}** being a server moderator.`);

      if (!Permissions.isMemberAbove(msg.member, member))
        return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above as you.`);

      if (!Permissions.isMemberAbove(msg.self!, member))
        return msg.reply(`User **${user.username}#${user.discriminator}** is the same or above me.`);
    }

    if (msg.member.voiceState.channelID === null)
      return msg.reply('You must be in a voice channel to perform this action.');

    const channel = this.discord.client.getChannel(msg.member.voiceState.channelID) as VoiceChannel;
    if (channel.voiceMembers.size === 1)
      return msg.reply('You must be in an active voice channel.');

    if (!channel.voiceMembers.has(user.id))
      return msg.reply(`Member **${user.username}#${user.discriminator}** is not in this voice channel.`);

    const voiceState = channel.voiceMembers.get(user.id)!.voiceState;
    if (voiceState.mute === true)
      return msg.reply(`Member **${user.username}#${user.discriminator}** is already server muted.`);

    const areason = reason.join(' ');
    let actualReason: string | undefined = undefined;
    let time: string | undefined = undefined;

    if (areason !== '') {
      const [r, t] = areason.split(' | ');
      actualReason = r;
      time = t;
    }

    // Nino needs to join the voice channel they're in.
    await this.discord.client.joinVoiceChannel(msg.member.voiceState.channelID);
    try {
      await this.punishments.apply({
        moderator: msg.author,
        publish: true,
        reason: actualReason,
        member: msg.guild.members.get(user.id) || { id: user.id, guild: msg.guild },
        type: PunishmentType.VoiceMute,
        time: time !== undefined ? ms(time!) : undefined
      });

      this.discord.client.leaveVoiceChannel(msg.member.voiceState.channelID);
      return msg.reply(`:thumbsup: Member **${user.username}#${user.discriminator}** has been server muted in voice channels.${reason.length ? ` *for ${reason.join(' ')}${time !== undefined ? `, for ${time}*` : '*'}` : '.'}`);
    } catch(ex) {
      if (ex instanceof DiscordRESTError && ex.code === 10007) {
        return msg.reply(`Member **${user.username}#${user.discriminator}** has left but been detected. Kinda weird if you ask me, to be honest.`);
      }

      return msg.reply([
        'Uh-oh! An internal error has occured while running this.',
        'Contact the developers in discord.gg/ATmjFH9kMH under <#824071651486335036>:',
        '',
        '```js',
        ex.stack ?? '<... no stacktrace? ...>',
        '```'
      ].join('\n'));
    }
  }
}
