import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class ShardInfoCommand extends Command {
    constructor(client: Bot) {
        super(client, {
            name: 'shardinfo',
            description: 'Gives you the bot shard info.',
            aliases: ['si', 'shards'],
            category: 'Generic',
            ownerOnly: false
        });
    }

    async run(ctx: Context) {
        let shardinfo = '';
        this.bot.client.shards.map((shard) =>
            shardinfo += `${shard.status === 'disconnected' ? '-' : shard.status === 'connecting' || shard.status === 'handshaking' ? '*' : '+'} Shard #${shard.id} ${ctx.guild.shard.id === shard.id ? '(current)' : ''}: ${shard.latency}ms\n`
        );
        return ctx.embed(
            this
                .bot
                .getEmbed()
                .setTitle(`${this.bot.client.user.username}#${this.bot.client.user.discriminator} | Shard Information`)
                .setDescription(`\`\`\`diff\n${shardinfo}\`\`\``)
                .build()
        );
    }
}