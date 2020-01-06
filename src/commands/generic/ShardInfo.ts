import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(
    @inject(TYPES.Bot) client: Bot
  ) {
    super(client, {
      name: 'shardinfo',
      description: 'Gives you the bot shard info.',
      aliases: ['si', 'shards'],
      category: 'Generic',
      ownerOnly: false,
    });
  }

  async run(ctx: Context) {
    let info = '';
    this.bot.client.shards.map(shard => {
      const current = ctx.guild!.shard.id === shard.id ? '(current)' : '';
      const guilds = this.bot.client.guilds.filter(g => g.shard.id === shard.id);
      const members = guilds.reduce((a, b) => a + b.memberCount, 0);
      info += `| ${this.determineStatus(shard.status)} | Shard #${shard.id} ${current} | G: ${guilds.length} | U: ${members} | L: ${shard.latency}ms |`;
    });

    const embed = this.bot.getEmbed()
      .setTitle(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} | Shard Information`)
      .setDescription(`\`\`\`diff\n${info}\n\`\`\``);

    return ctx.embed(embed.build());
  }

  determineStatus(status: string) {
    return (
      status === 'disconnected' ? '-' :
        status === 'connecting' || status === 'handshaking' ? '*' :
          '+'
    );
  }
}