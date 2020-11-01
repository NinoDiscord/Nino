import { Constants, Message, TextChannel } from 'eris';
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

  async emit(message: Message<TextChannel>) {
    if (!message.author || ![0, 5, 6].includes(message.channel.type)) return;

    // TODO: Get a threat severity level from Automod
    // Send the message to the channel if they have the apporiate settings
    const guild = message.channel.guild;
    const settings = await this.bot.settings.getOrCreate(guild.id);

    // Don't do anything about this if they don't want it enabled
    if (!settings.logging.enabled || !settings.logging.events.messageDelete) return;
    if (settings.logging.ignore.length && settings.logging.ignore.includes(message.channel.id)) return;
    if (settings.logging.ignoreUsers.length && settings.logging.ignoreUsers.includes(message.author.id)) return;

    // Don't do anything if the bot doesn't have sendMessages perm or the channel doesn't exist
    if (
      !guild.channels.has(settings.logging.channelID) ||
      !guild.channels.get(settings.logging.channelID)!.permissionsOf(this.bot.client.user.id).has('sendMessages')
    ) return;

    // Ignore "User has pinned a message" messages
    const PinnedRegex = /pinned a message/g;
    if (PinnedRegex.test(message.content)) return;

    // Ignore if the bot deleted it
    if (message.author.id === this.bot.client.user.id) return;

    // Get the channel (so we won't get faulty errors)
    const channel = guild.channels.get(settings.logging.channelID)! as TextChannel;

    // Create an embed and get the message content
    const author = message.author.system 
      ? 'System'
      : `${message.author.username}#${message.author.discriminator}`;
    const timestamp = new Date(message.createdAt);
    const embed = createEmptyEmbed()
      .setAuthor(`Message was deleted by ${author} in #${message.channel.name}`, '', message.author.avatarURL)
      .setTimestamp(timestamp);

    if (message.embeds.length > 0) {
      const em = message.embeds[0];

      if (em.author) embed.setAuthor(em.author.name, em.author.url, em.author.icon_url);
      if (em.description) embed.setDescription(em.description.length > 2000 ? `${em.description.slice(0, 1993)}...` : em.description);
      if (em.fields && em.fields.length > 0) {
        for (const field of em.fields) embed.addField(field.name, field.value, field.inline || false);
      }

      if (em.title) embed.setTitle(em.title);
      if (em.url) embed.setURL(em.url);
    } else {
      embed.setDescription(`${message.content.length > 1997 ? `${message.content.slice(0, 1995)}...` : message.content || 'None was provided?'}`);
    }

    // TODO: Add customizable messages to this
    await channel.createMessage({
      embed: embed.build()
    });
  }
}