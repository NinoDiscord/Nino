import { Message, TextChannel } from 'eris';
import { inject, injectable } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { createEmptyEmbed } from '../util/EmbedUtils';

@injectable()
export default class MessageDeleteEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Client
  ) {
    super(bot, 'messageDelete');
  }

  async emit(message: Message) {
    if (!message.author || ![0, 5, 6].includes(message.channel.type)) return;

    // TODO: Get a threat severity level from Automod
    // Send the message to the channel if they have the apporiate settings
    const guild = (message.channel as TextChannel).guild;
    const settings = await this.bot.settings.getOrCreate(guild.id);

    // Don't do anything about this if they don't want it enabled
    if (!settings.logging.enabled || !settings.logging.events.messageDelete) return;
    if (settings.logging.ignore.length && settings.logging.ignore.includes(message.channel.id)) return;

    // Don't do anything if the bot doesn't have sendMessages perm or the channel doesn't exist
    if (
      !guild.channels.has(settings.logging.channelID) ||
      !guild.channels.get(settings.logging.channelID)!.permissionsOf(this.bot.client.user.id).has('sendMessages')
    ) return;

    // Get the channel (so we won't get faulty errors)
    const channel = guild.channels.get(settings.logging.channelID)! as TextChannel;

    // Create an embed and get the message content
    const timestamp = new Date(message.createdAt);
    const embed = createEmptyEmbed()
      .setAuthor(`${message.author.username}#${message.author.discriminator} in #${(message.channel as TextChannel).name}`, undefined, message.author.dynamicAvatarURL('png', 1024))
      .setTimestamp(timestamp);

    let content!: string;
    if (message.embeds.length) {
      const em = message.embeds[0];
      content = `[Embed]\n${em.title ? em.title : 'None'}\n${em.description ? em.description : '...'}${em.timestamp instanceof Date ? `\n(${em.timestamp.toISOString()})` : ''}`;
    } else {
      content = message.content;
    }

    embed.addField('Content', stripIndents`
      \`\`\`prolog
      ${content}

      ${message.attachments.length ? message.attachments.slice(0, 3).map(x => x.url).join('\n') : ''}
      \`\`\`
    `);

    // TODO: Add customizable messages to this
    await channel.createMessage({
      content: ':wastebasket: **| Message was deleted**',
      embed: embed.build()
    });
  }
}