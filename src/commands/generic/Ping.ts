import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import Eris, { Client } from 'eris';

@injectable()
export default class PingCommand extends Command {
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @inject(TYPES.Client) private client: Client
  ) {
    super(bot, {
      name: 'ping',
      description: 'Shows you the bot\'s ping.',
      aliases: ['pong', 'pang'],
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    const shardManager = this.client.shards;
    const startedAt = Date.now();
    const message = await ctx.sendTranslate('commands.generic.ping.oldMessage');

    const ws = shardManager.reduce((a, b) => a + b.latency, 0);
    const m = ctx.translate('commands.generic.ping.message', {
      id: ctx.guild ? ctx.guild.shard.id : 0,
      shard: ws,
      messageLatency: Date.now() - startedAt
    });

    return message.edit(m);
  }
}
