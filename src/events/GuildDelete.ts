import { inject, injectable } from 'inversify';
import { Client, Guild, TextChannel } from 'eris';
import { TYPES } from '../types';
import Bot from '../structures/Bot';
import Event from '../structures/Event';
import { createEmptyEmbed } from '../util/EmbedUtils';
import GuildSettingsService from '../structures/services/settings/GuildSettingsService';
import StatusManager from '../structures/managers/StatusManager';
import CommandStatisticsManager from '../structures/managers/CommandStatisticsManager';

@injectable()
export default class GuildLeftEvent extends Event {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.Client) private client: Client,
      @inject(TYPES.GuildSettingsService) private guildSettingsService: GuildSettingsService,
      @inject(TYPES.StatusManager) private statusManager: StatusManager,
      @inject(TYPES.CommandStatisticsManager) private commandStatisticsManager: CommandStatisticsManager
  ) {
    super(bot, 'guildDelete');
  }

  async emit(guild: Guild) {
    await this.guildSettingsService.remove(guild.id);
    this.bot.logger.warn(`Left guild ${guild.name} (${guild.id})`);

    this.statusManager.updateStatus();
    this.commandStatisticsManager.guildCount--;
    await this.bot.redis.set('guilds', this.client.guilds.size);
    const channel = this.client.getChannel('529593466729267200');
    if (channel.type === 0) {
      const chan = (channel as TextChannel);
      const embed = createEmptyEmbed()
        .setAuthor(`| Left ${guild.name} (${guild.id})`, undefined, this.client.user.dynamicAvatarURL('png', 1024))
        .setFooter(`Now at ${this.client.guilds.size} Guilds`)
        .build();

      await chan.createMessage({ embed });
    }
  }
}
