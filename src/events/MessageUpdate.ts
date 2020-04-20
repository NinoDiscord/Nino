import { Message, TextChannel, Attachment, EmbedOptions } from 'eris';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

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
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message, old: OldMessage | null) {
    // Do the automod service first
    await this.bot.automod.handleMessage(m);

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

    // Check if the channel doesn't exists or Nino doesn't have permission to shoot messages in that channel
    if (
      !guild.channels.has(settings.logging.channelID) ||
      !guild.channels.get(settings.logging.channelID)!.permissionsOf(this.bot.client.user.id).has('sendMessages')
    ) return;

    // Don't log anything that wasn't edited by Nino
    if (m.author.id === this.bot.client.user.id) return;

    // Don't log any bot-related data
    if (m.author.bot) return;

    // Don't log http/https links
    const HTTPS_REGEX = /^https?:\/\/(.*)/;

    // But why?
    // `old` can be represented as null (according to Eris' docs), so we check for if `old` is null and if `old.content` exists
    const ternary = old ? old.content && HTTPS_REGEX.test(old.content) : false;
    if (HTTPS_REGEX.test(m.content) && ternary) return;

    const channel = (<TextChannel> guild.channels.get(settings.logging.channelID)!);
    const timestamp = new Date(m.createdAt);
    const embed = this.bot.getEmbed()
      .setAuthor(`${m.author.username}#${m.author.discriminator} in #${(m.channel as TextChannel).name}`, undefined, m.author.dynamicAvatarURL('png', 1024))
      .setTimestamp(timestamp)
      .addField('Old Content', stripIndents`
        \`\`\`prolog
        ${old ? old.content : 'None?'}
        \`\`\`
      `)
      .addField('New Content', stripIndents`
        \`\`\`prolog
        ${m.content}
        \`\`\`
      `);
  
    // TODO: Add customizable messages to this
    channel.createMessage({
      content: ':pencil2: **| Message was updated**',
      embed: embed.build()
    });
  }
}