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

import { Command, CommandMessage, EmbedBuilder, Subcommand } from '../../structures';
import { LoggingEvents } from '../../entities/LoggingEntity';
import { Categories } from '../../util/Constants';
import { Inject } from '@augu/lilith';
import Database from '../../components/Database';

const humanizedEvents = {
  [LoggingEvents.VoiceChannelSwitch]: 'Voice Channel Switch',
  [LoggingEvents.VoiceChannelLeft]: 'Voice Channel Leave',
  [LoggingEvents.VoiceChannelJoin]: 'Voice Channel Join',
  [LoggingEvents.MessageUpdated]: 'Message Updated',
  [LoggingEvents.MessageDeleted]: 'Message Deleted',
};

export default class SettingsCommand extends Command {
  @Inject
  private readonly database!: Database;

  constructor() {
    super({
      userPermissions: ['manageGuild'],
      description: 'descriptions.settings',
      category: Categories.Settings,
      aliases: ['config', 'conf'],
      name: 'settings',
    });
  }

  async run(msg: CommandMessage) {
    // Bulk get all guild settings
    const [settings, automod, logging] = await Promise.all([
      this.database.guilds.get(msg.guild.id),
      this.database.automod.get(msg.guild.id),
      this.database.logging.get(msg.guild.id),
    ]);

    const embed = EmbedBuilder.create()
      .setTitle(`[ :pencil2: Settings for ${msg.guild.name} (${msg.guild.id}) ]`)
      .addFields([
        {
          name: '❯ Settings',
          value: [
            `• **Muted Role**: ${
              settings.mutedRoleID !== null ? `<@&${settings.mutedRoleID}> (**${settings.mutedRoleID}**)` : 'None'
            }`,
            `• **Mod Log**: ${
              settings.modlogChannelID !== null
                ? `<#${settings.modlogChannelID}> (**${settings.modlogChannelID}**)`
                : 'None'
            }`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '❯ Automod',
          value: [
            `• ${automod!.shortLinks ? msg.successEmote : msg.errorEmote} **Short Links**`,
            `• ${automod!.blacklist ? msg.successEmote : msg.errorEmote} **Blacklist Words**`,
            `• ${automod!.mentions ? msg.successEmote : msg.errorEmote} **Mentions**`,
            `• ${automod!.dehoist ? msg.successEmote : msg.errorEmote} **Dehoisting**`,
            `• ${automod!.invites ? msg.successEmote : msg.errorEmote} **Invites**`,
            `• ${automod!.raid ? msg.successEmote : msg.errorEmote} **Raid**`,
            `• ${automod!.spam ? msg.successEmote : msg.errorEmote} **Spam**`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '❯ Logging',
          value: [
            `• **Channels Ignored**: ${logging.ignoreChannels.length}`,
            `• **Users Ignored**: ${logging.ignoreUsers.length}`,
            `• **Channel**: ${
              logging.channelID !== null ? `<#${logging.channelID}> (**${logging.channelID}**)` : 'None'
            }`,
            `• **Enabled**: ${logging.enabled ? msg.successEmote : msg.errorEmote}`,
            `• **Events**: ${logging.events.map((ev) => humanizedEvents[ev]).join(', ') || 'None'}`,
          ].join('\n'),
          inline: true,
        },
      ]);

    return msg.reply(embed);
  }
}
