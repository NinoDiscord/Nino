import { Message, TextChannel } from 'eris';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class MessageUpdatedEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'messageUpdate');
  }

  async emit(m: Message) {
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

    const channel = (<TextChannel> guild.channels.get(settings.logging.channelID)!);
    const timestamp = new Date(m.createdAt);
    const embed = this.bot.getEmbed()
      .setAuthor(`${m.author.username}#${m.author.discriminator} in #${(m.channel as TextChannel).name}`, undefined, m.author.dynamicAvatarURL('png', 1024))
      .setTimestamp(timestamp);

    if (m.embeds.length > 0) {
      const msgEmbed = m.embeds[0];
      embed.setDescription(stripIndents`
        __**${msgEmbed.title}**__
        > **${msgEmbed.description}**
  
        - Timestamp: ${msgEmbed.timestamp ? new Date(msgEmbed.timestamp).toUTCString() : '12/31/2014 (00:00)'}
        - Footer: ${msgEmbed.footer ? msgEmbed.footer.text : 'None'}
      `);
  
      if (msgEmbed.fields && msgEmbed.fields.length) {
        for (const field of msgEmbed.fields) {
          embed.addField(field.name!, field.value!, field.inline);
        }
      }
    } else {
      const msg = m.content.startsWith('> ') ? m.content : `> ${m.content}`;
      embed.setDescription(msg);
    }
  
    // TODO: Add customizable messages to this
    channel.createMessage({
      content: ':pencil2: **| Message was updated**',
      embed: embed.build()
    });
  }
}