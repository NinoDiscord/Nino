import { inject, injectable } from 'inversify';
import { Message, TextChannel } from 'eris';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';
import GuildSettingsService from '../structures/services/settings/GuildSettingsService';
import { createEmptyEmbed } from '../util/EmbedUtils';
import { unembedify } from '../util';

@injectable()
export default class MessageDeleteBulkEvent extends Event {
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.GuildSettingsService) private settings: GuildSettingsService
  ) {
    super(bot, 'messageDeleteBulk');
  }

  async emit(messages: Message<TextChannel>[]) {
    // Include only cached messages
    const all = messages
      .filter(msg => msg.content !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Get the settings
    const message = all[0];
    const guild = all[0].channel.guild;
    const settings = await this.settings.getOrCreate(guild.id);

    if (!settings.logging.enabled || !settings.logging.events.messageDelete) return;
    if (settings.logging.ignore.length && settings.logging.ignore.includes(message.channel.id)) return;
    if (settings.logging.ignoreUsers.length && settings.logging.ignoreUsers.includes(message.author.id)) return;

    // Don't do anything if the bot doesn't have sendMessages perm or the channel doesn't exist
    if (
      !guild.channels.has(settings.logging.channelID) ||
      !guild.channels.get(settings.logging.channelID)!.permissionsOf(this.bot.client.user.id).has('sendMessages')
    ) return;

    // idk how to do this properly so ig this will do
    const buffers: Buffer[] = [];
    for (let i = 0; i < all.length; i++) {
      const msg = all[i];
      const contents = [
        `[ Message #${i + 1}/${all.length} ]`,
        '',
        `Created At: ${new Date(msg.createdAt).toUTCString()}`,
        `Author:  ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
        `Guild: ${msg.channel.guild.name} (${msg.channel.guild.id})`
      ];

      contents.push('');
      if (msg.embeds.length) {
        contents.push(msg.content, '');
        for (let i = 0; i < msg.embeds.length; i++) {
          const content = unembedify(msg.embeds[i]);
          contents.push(content, '', '');
        }
      } else {
        contents.push(msg.content);
      }

      contents.push(
        '--------------------------------------',
        ''
      );

      buffers.push(Buffer.from(contents.join('\n')));
    }

    const buffer = Buffer.concat(buffers);
    const channel = guild.channels.get(settings.logging.channelID)! as TextChannel;
    const users: string[] = [];

    all.map(msg => {
      if (!users.includes(msg.author.username)) users.push(msg.author.username);
    });

    const embed = createEmptyEmbed()
      .setTitle('[ Bulk Message Deletion Occured ]')
      .setDescription([
        `Recent occurence of bulk deleted message has occured in ${message.channel.mention}, view file for all bulk deleted messages.`,
        '',
        '```apache',
        `Affected Users: ${users.join(', ')}`,
        `Messages Deleted: ${all.length}/${messages.length} (${((all.length / messages.length) * 100).toFixed(2)}% cached)`,
        '```'
      ].join('\n'));

    const promises = [
      channel.createMessage({
        embed: embed.build()
      }),
      channel.createMessage('', { file: buffer, name: `trace_${Date.now()}.txt` })
    ];

    await Promise.all(promises);
  }
}
