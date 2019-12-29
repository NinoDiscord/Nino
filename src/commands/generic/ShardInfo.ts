import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'shardinfo',
      description: 'Gives you the bot shard info.',
      aliases: ['si', 'shards'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    let shardinfo = '';
    ctx.client.shards.map(
      shard =>
        (shardinfo += `${
          shard.status === 'disconnected'
            ? '-'
            : shard.status === 'connecting' || shard.status === 'handshaking'
            ? '*'
            : '+'
        } Shard #${shard.id} ${
          ctx.guild!.shard.id === shard.id ? '(current)' : ''
        }: ${shard.latency}ms\n`)
    );
    return ctx.embed(
      this.bot
        .getEmbed()
        .setTitle(
          `${ctx.client.user.username}#${ctx.client.user.discriminator} | Shard Information`
        )
        .setDescription(`\`\`\`diff\n${shardinfo}\`\`\``)
        .build()
    );
  }
}
