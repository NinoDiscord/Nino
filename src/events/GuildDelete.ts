import { injectable, inject } from 'inversify';
import { Guild, TextChannel } from 'eris';
import { TYPES } from '../types';
import Client from '../structures/Bot';
import Event from '../structures/Event';

@injectable()
export default class GuildLeftEvent extends Event {
  constructor(
    @inject(TYPES.Bot) client: Client
  ) {
    super(client, 'guildDelete');
  }

  async emit(guild: Guild) {
    this.bot.settings.remove(guild.id);
    this.bot.logger.warn(`Left guild ${guild.name} (${guild.id})`);

    this.bot.status.updateStatus();
    this.bot.prometheus.guildCount.inc();
    this.bot.statistics.guildCount--;
    await this.bot.redis.set('guilds', this.bot.client.guilds.size);
    const channel = await this.bot.client.getRESTChannel('529593466729267200');
    if (channel.type === 0) {
      const chan = (channel as TextChannel);
      const embed = this.bot.getEmbed()
        .setAuthor(`| Joined ${guild.name} (${guild.id})`, undefined, this.bot.client.user.dynamicAvatarURL('png', 1024))
        .setFooter(`Now at ${this.bot.client.guilds.size} Guilds`, this.bot.client.user.dynamicAvatarURL('png', 1024))
        .build();

      chan.createMessage({ embed });
    }
  }
}