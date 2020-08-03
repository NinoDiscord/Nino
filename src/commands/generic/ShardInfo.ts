import { injectable, inject } from 'inversify';
import { formatSize } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import { Client } from 'eris';
import { createEmptyEmbed } from '../../util/EmbedUtils';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.Client) private client: Client
  ) {
    super(bot, {
      name: 'shardinfo',
      description: 'Gives you the bot shard info.',
      aliases: ['si', 'shards'],
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    let info = '';

    for (const shard of this.client.shards.values()) {
      const current = ctx.guild!.shard.id === shard.id ? '(current)' : '';
      const guilds = this.client.guilds.filter(g => g.shard.id === shard.id);
      const members = guilds.reduce((a, b) => a + b.memberCount, 0);
      const memory = formatSize(process.memoryUsage().rss);
      const translated = ctx.translate('commands.generic.shardinfo.shard', {
        current,
        latency: shard.latency,
        guilds: guilds.length,
        users: members,
        'shard.id': shard.id,
        memory
      });

      const prefix = shard.status === 'disconnected' ? '-' : shard.status === 'connecting' || shard.status === 'handshaking' ? '*' : '+';
      info += `${prefix} ${translated}`;
    }

    const embed = createEmptyEmbed()
      .setTitle(ctx.translate('commands.generic.shardinfo.title'))
      .setDescription(`\`\`\`diff\n${info}\n\`\`\``);

    return ctx.embed(embed.build());
  }
}