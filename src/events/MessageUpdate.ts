import { Attachment, EmbedOptions, Message, TextChannel } from 'eris';
import { inject, injectable } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { createEmptyEmbed } from '../util/EmbedUtils';
import CommandService from '../structures/services/CommandService';

interface OldMessage {
  editedTimestamp: number;
  channelMentions: string[];
  roleMentions: string[];
  mentionedBy: { [x: string]: any };
  attachments: Attachment[];
  mentions: string[];
  content: string;
  embeds: EmbedOptions[];
  pinned: boolean;
  tts: boolean;
}

@injectable()
export default class MessageUpdatedEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client,
    @inject(TYPES.CommandService) private commands: CommandService
  ) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message<TextChannel>, old: OldMessage | null) {
    // Do the automod service first
    await this.bot.automod.handleMessage(m);

    // If it's null, let's not do anything
    if (old === null) return;

    // Let's do the command service next
    if (m.content !== old.content) await this.commands.handle(m);

    // Retrive the guild settings
    const guild = (m.channel as TextChannel).guild;
    const settings = await this.bot.settings.getOrCreate(guild.id);

    // Don't do anything if they don't want it enabled
    if (
      !settings.logging.enabled ||
      !settings.logging.events.messageUpdate
    ) return;

    // Check if they have channels to ignore and the channel id is included in the array
    if (
      settings.logging.ignore.length &&
      settings.logging.ignore.includes(m.channel.id)
    ) return;

    // Check if they have users ignored and check if the user is included in the array
    if (
      settings.logging.ignoreUsers.length && 
      settings.logging.ignoreUsers.includes(m.author.id)
    ) return;

    // Check if the channel doesn't exists or Nino doesn't have permission to shoot messages in that channel
    if (
      !guild.channels.has(settings.logging.channelID) ||
      !guild.channels.get(settings.logging.channelID)!.permissionsOf(this.bot.client.user.id).has('sendMessages')
    ) return;

    // Don't log anything that wasn't edited by Nino
    if (m.author.id === this.bot.client.user.id) return;

    // Don't log any bot-related data
    if (m.author.bot) return;

    // Check if content is the same
    // root cause of published messages
    if (old.content === m.content) return;

    // Don't do anything if the guild is unavaliable
    const server = m.guildID ? this.bot.client.guilds.get(m.guildID) : null;
    if (server != null && server.unavailable) return;

    // Don't log http/https links
    const HTTPS_REGEX = /^https?:\/\/(.*)/;

    // `old` can be represented as null (according to Eris' docs), so we check for if `old` is null and if `old.content` exists
    const oldHasIt = old.content && HTTPS_REGEX.test(old.content);
    if (HTTPS_REGEX.test(m.content) || oldHasIt) return;

    // Embeds are considered as "updated"?
    if (old.embeds.length) return;

    // Check if it's pinned (bc discord is literally shit)
    if (!old.pinned && m.pinned) return;

    const author = m.author.system 
      ? 'System'
      : `${m.author.username}#${m.author.discriminator}`;

    const jumpUrl = `https://discord.com/channels/${m.guildID}/${m.channel.id}/${m.id}`;
    const channel = (<TextChannel> guild.channels.get(settings.logging.channelID)!);
    const embed = createEmptyEmbed()
      .setAuthor(`Message was updated by ${author} in #${m.channel.name}`, '', m.author.avatarURL)
      .setDescription(`[[Jump Here]](${jumpUrl})`)
      .addField('Old Content', old.content.length > 1993 ? `${old.content.slice(0, 1993)}...` : old.content || 'None provided')
      .addField('New Content', m.content.length > 1993 ? `${m.content.slice(0, 1993)}...` : m.content || 'None provided');

    // TODO: Add customizable messages to this
    await channel.createMessage({
      embed: embed.build()
    });
  }
}