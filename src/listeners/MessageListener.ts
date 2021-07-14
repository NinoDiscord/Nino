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

import { Constants, Message, OldMessage, TextChannel } from 'eris';
import { Inject, Subscribe } from '@augu/lilith';
import { LoggingEvents } from '../entities/LoggingEntity';
import { EmbedBuilder } from '../structures';
import CommandService from '../services/CommandService';
import AutomodService from '../services/AutomodService';
import { Color } from '../util/Constants';
import Database from '../components/Database';
import Discord from '../components/Discord';

const HTTP_REGEX = /^https?:\/\/(.*)/;

export default class MessageListener {
  @Inject
  private readonly commands!: CommandService;

  @Inject
  private readonly automod!: AutomodService;

  @Inject
  private readonly database!: Database;

  @Inject
  private readonly discord!: Discord;

  @Subscribe('messageCreate', { emitter: 'discord' })
  onMessageCreate(msg: Message<TextChannel>) {
    return this.commands.handleCommand(msg);
  }

  @Subscribe('messageDelete', { emitter: 'discord' })
  async onMessageDelete(msg: Message<TextChannel>) {
    if (!msg.author || ![0, 5].includes(msg.channel.type))
      return;

    const settings = await this.database.logging.get(msg.guildID);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.MessageDeleted))
      return;

    if (settings.ignoreChannels.length > 0 && settings.ignoreChannels.includes(msg.channel.id))
      return;

    if (settings.ignoreUsers.length > 0 && settings.ignoreUsers.includes(msg.author.id))
      return;

    if (settings.channelID !== undefined && (
      !msg.channel.guild.channels.has(settings.channelID) ||
      !msg.channel.guild.channels.get<TextChannel>(settings.channelID)?.permissionsOf(this.discord.client.user.id).has('sendMessages')
    )) return;

    if (msg.content.indexOf('pinned a message') !== -1)
      return;

    if (msg.author.id === this.discord.client.user.id)
      return;

    if (msg.author.system)
      return;

    // It's in a closure so we don't have to use `return;` on the outer scope
    const auditLog = await (async() => {
      if (!msg.channel.guild.members.get(this.discord.client.user.id)?.permissions.has('viewAuditLogs'))
        return undefined;

      const audits = await msg.channel.guild.getAuditLog({ limit: 3, actionType: Constants.AuditLogActions.MESSAGE_DELETE });
      return audits.entries.find(entry => entry.targetID === msg.author.id && entry.user.id !== msg.author.id && entry.user.id !== this.discord.client.user.id);
    })();

    const channel = msg.channel.guild.channels.get<TextChannel>(settings.channelID!);
    const author = msg.author.system ? 'System' : `${msg.author.username}#${msg.author.discriminator}`;
    const embed = new EmbedBuilder().setColor(Color);

    if (auditLog !== undefined)
      embed.setFooter(`Message was actually deleted by ${auditLog.user.username}#${auditLog.user.discriminator} (${auditLog.user.id})`);

    if (msg.embeds.length > 0) {
      const em = msg.embeds[0];
      if (em.author) embed.setAuthor(em.author.name, em.author.url, em.author.icon_url);
      if (em.description) embed.setDescription(em.description.length > 2000 ? `${em.description.slice(0, 1993)}...` : em.description);
      if (em.fields && em.fields.length > 0) {
        for (const field of em.fields) embed.addField(field.name, field.value, field.inline || false);
      }

      if (em.footer) {
        const footer = embed.footer;
        embed.setFooter(footer !== undefined ? `${em.footer.text} (${footer.text})` : em.footer.text, em.footer.icon_url);
      }

      if (em.title) embed.setTitle(em.title);
      if (em.url) embed.setURL(em.url);
    } else {
      embed.setDescription(msg.content.length > 1997 ? `${msg.content.slice(0, 1995)}...` : msg.content || 'Nothing was provided (probably attachments)');
    }

    return channel.createMessage({
      content: `**[** A message was deleted by **${author}** (⁄ ⁄•⁄ω⁄•⁄ ⁄) in <#${msg.channel.id}> **]**`,
      embed: embed.build()
    });
  }

  @Subscribe('messageUpdate', { emitter: 'discord' })
  async onMessageUpdate(msg: Message<TextChannel>, old: OldMessage | null) {
    await this.automod.run('message', msg);

    if (old === null)
      return;

    if (old.content === msg.content)
      return;

    // discord is shit send help please
    if (old.pinned && !msg.pinned)
      return;

    if (msg.content !== old.content)
      await this.commands.handleCommand(msg);

    // await this.automod.onMessageUpdate(msg, old);
    const settings = await this.database.logging.get(msg.channel.guild.id);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.MessageUpdated))
      return;

    if (settings.ignoreChannels.length > 0 && settings.ignoreChannels.includes(msg.channel.id))
      return;

    if (settings.ignoreUsers.length > 0 && settings.ignoreUsers.includes(msg.author.id))
      return;

    if (settings.channelID !== undefined && (
      !msg.channel.guild.channels.has(settings.channelID) ||
      !msg.channel.guild.channels.get<TextChannel>(settings.channelID)?.permissionsOf(this.discord.client.user.id).has('sendMessages')
    )) return;

    if (msg.content.indexOf('pinned a message') !== -1)
      return;

    if (msg.author.id === this.discord.client.user.id)
      return;

    // discord being shit part 2
    if (HTTP_REGEX.test(old.content))
      return;

    const channel = msg.channel.guild.channels.get<TextChannel>(settings.channelID!);
    const author = msg.author.system ? 'System' : `${msg.author.username}#${msg.author.discriminator}`;
    const jumpUrl = `https://discord.com/channels/${msg.guildID}/${msg.channel.id}/${msg.id}`;
    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(`**[[Jump Here]](${jumpUrl})**`)
      .addFields([
        {
          name: '❯ Old Message Content',
          value: old.content || 'Nothing was provided (probably attachments?)',
          inline: false
        },
        {
          name: '❯ Message Content',
          value: msg.content || 'Nothing was provided?'
        }
      ]);

    return channel.createMessage({
      content: `**[** A message was updated by **${author}** (⁄ ⁄•⁄ω⁄•⁄ ⁄) in <#${msg.channel.id}> **]**`,
      embed: embed.build()
    });
  }

  @Subscribe('messageDeleteBulk', { emitter: 'discord' })
  async onMessageDeleteBulk(messages: Message<TextChannel>[]) {
    const allMsgs = messages
      .filter(msg => msg.guildID !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const msg = allMsgs[0];
    const settings = await this.database.logging.get(msg.channel.guild.id);
    if (!settings.enabled || !settings.events.includes(LoggingEvents.MessageUpdated))
      return;

    if (!settings.channelID)
      return;

    if (!msg.channel.guild)
      return;

    if (!msg.channel.guild.channels.has(settings.channelID) || !msg.channel.guild.channels.get<TextChannel>(settings.channelID)?.permissionsOf(this.discord.client.user.id).has('sendMessages'))
      return;

    const buffers: Buffer[] = [];
    for (let i = 0; i < allMsgs.length; i++) {
      const msg = allMsgs[i];

      // skip all that don't have an author
      if (!msg.author)
        continue;

      const contents = [
        `♥*♡∞:｡.｡  [ Message #${i + 1} / ${allMsgs.length} ]　｡.｡:∞♡*♥`,
        `❯ Created At: ${new Date(msg.createdAt).toUTCString()}`,
        `❯ Author    : ${msg.author.username}#${msg.author.discriminator}`,
        `❯ Channel   : #${msg.channel.name} (${msg.channel.id})`,
        ''
      ];

      if (msg.embeds.length > 0) {
        contents.push(msg.content);
        contents.push('\n');

        for (let j = 0; j < msg.embeds.length; j++) {
          const embed = msg.embeds[j];
          let content = `[ Embed ${j + 1}/${msg.embeds.length} ]\n`;
          if (embed.author !== undefined)
            content += `❯ ${embed.author.name}${embed.author.url !== undefined ? ` (${embed.author.url})` : ''}\n`;

          if (embed.title !== undefined)
            content += `❯ ${embed.title}${embed.url !== undefined ? ` (${embed.url})` : ''}\n`;

          if (embed.description !== undefined)
            content += `${embed.description}\n\n`;

          if (embed.fields !== undefined)
            content += embed.fields.map(field => `• ${field.name}: ${field.value}`).join('\n') + '\n';

          if (embed.footer !== undefined)
            content += `${embed.footer.text}${embed.timestamp !== undefined ? ` (${(embed.timestamp instanceof Date ? embed.timestamp : new Date(embed.timestamp)).toUTCString()})` : ''}`;

          contents.push(content, '\n');
        }
      } else {
        contents.push(msg.content, '\n');
      }

      buffers.push(Buffer.from(contents.join('\n')));
    }

    // Don't do anything if we can't create a message
    if (buffers.length > 0)
      return;

    const buffer = Buffer.concat(buffers);
    const channel = msg.channel.guild.channels.get<TextChannel>(settings.channelID!);
    const users: string[] = [...new Set(allMsgs.map(m => `${m.author.username}#${m.author.discriminator}`))];
    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription([
        `${allMsgs.length} messages were deleted in ${msg.channel.mention}, view the file below to read all messages`,
        '',
        '```apache',
        `❯ Messages Deleted ~> ${allMsgs.length}/${messages.length} (${((allMsgs.length / messages.length) * 100).toFixed(1)}% cached)`,
        `❯ Affected Users   ~> ${users.join(', ')}`,
        '```'
      ]);

    await Promise.all([
      channel.createMessage({ embed: embed.build() }),
      channel.createMessage('', { file: buffer, name: `trace_${Date.now()}.txt` })
    ]);
  }
}
