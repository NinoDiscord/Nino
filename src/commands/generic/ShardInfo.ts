import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ShardInfoCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'shardinfo',
      description: 'Gives you the bot shard info.',
      aliases: ['si', 'shards'],
      category: 'Generic',
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    let info = '';

    ctx.bot.client.shards.map(shard => {
      const current = ctx.guild!.shard.id === shard.id ? '(current)' : '';
      const guilds = ctx.bot.client.guilds.filter(g => g.shard.id === shard.id);
      const members = guilds.reduce((a, b) => a + b.memberCount, 0);
      const translated = ctx.translate('commands.generic.shardinfo.shard', {
        current,
        latency: shard.latency,
        guilds,
        users: members,
        id: shard.id
      });

      info += `${shard.status === 'disconnected' ? '-' : shard.status === 'connecting' || shard.status === 'handshaking' ? '*' : '+'} | ${translated} |`;
    });

    const embed = ctx.bot.getEmbed()
      .setTitle(ctx.translate('commands.generic.shardinfo.title'))
      .setDescription(`\`\`\`diff\n${info}\n\`\`\``);

    return ctx.embed(embed.build());
  }
}
