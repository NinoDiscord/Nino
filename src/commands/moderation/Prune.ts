import { injectable, inject } from 'inversify';
import { Constants, Message } from 'eris';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class PruneCommand extends Command {
  public filters: string[] = ['new', 'bot', 'user', 'self'];
  public weeks: number = Date.now() - (1000 * 60 * 60 * 24 * 14);

  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'prune',
      description: 'Prunes messages by a filter from the current or a different channel',
      usage: '<amount> [--filter="bot" | "user" | "new" | "self"]',
      aliases: ['purge', 'delmsg'],
      category: 'Moderation',
      userPermissions: Constants.Permissions.manageMessages,
      botPermissions: Constants.Permissions.manageMessages,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.send('You must provide an amount of messages to delete.');

    const arg = ctx.args.get(0);
    const amount = Number(arg);

    if (isNaN(amount)) return ctx.send('You didn\'t provide a valid number.');
    if (amount < 2) return ctx.send('The amount of messages has to be greater or equal to 2');
    if (amount > 100) return ctx.send('The amount of messages has to be less than or equal to 2');

    const allMsgs = await ctx.message.channel.getMessages(amount);
    const filter = ctx.flags.get('filter') || ctx.flags.get('f');

    if (typeof filter === 'boolean') return ctx.send(`You must append a value to the \`--filter\` flag. Example: **--filter=new** (Avaliable filters: ${this.filters.join(', ')})`);
    if (filter && !this.filters.includes(filter)) return ctx.send(`Invalid filter (${this.filters.join(', ')})`);
  
    const shouldDelete = allMsgs.filter(x => 
      (filter === 'user' ? !x.author.bot : true) &&
      (filter === 'self' ? x.author.id === this.bot.client.user.id : true) &&
      (filter === 'bot' ? x.author.bot : true) &&
      (filter === 'new' ? x.timestamp > this.weeks : true)   
    );

    if (!shouldDelete.length) return ctx.send(`Couldn't find any messages with filter: \`${filter}\``);

    const message = await ctx.send(`Now deleting ${shouldDelete.length} messages...`);
    try {
      shouldDelete.map(async (msg) => await ctx.message.channel.deleteMessage(msg.id));
      const msgs: string[] = [];

      // This looks ugly but it's gonna have to do I guess?
      shouldDelete.map(x => {
        if (!msgs.includes(x.author.id)) msgs.push(x.author.id);
      });

      const allUsers = msgs.map(x => {
        const author = this.bot.client.users.get(x)!;
        const messages = shouldDelete.filter(e => e.author.id === x).length;
        return `${author.username}#${author.discriminator} with ${messages} message${messages > 1 ? 's' : ''}`;
      }).join('\n');

      const embed = this.bot.getEmbed()
        .setAuthor('| Pruned Results', undefined, this.bot.client.user.dynamicAvatarURL('png', 1024))
        .setDescription(stripIndents`
          **Deleted ${shouldDelete.length} messages**
          \`\`\`prolog
          ${allUsers}
          \`\`\`
        `);

      await message.delete();
      return ctx.embed(embed.build());
    } catch(ex) {
      if (ex.message.includes(' is more then 2 weeks old.')) {
        const messages = shouldDelete.filter(x => x.timestamp < this.weeks);
        return ctx.send(`Unable to delete ${messages.length} messages due to Discord's limitations.`);
      } else {
        const embed = this.bot.getEmbed()
          .setTitle('Unable to delete messages')
          .setDescription(stripIndents`
            \`\`\`js
            ${ex.stack ? ex.stack.split('\n')[0] : ex.message}
            \`\`\`
          `);
        
        return ctx.embed(embed.build());
      }
    }
  }
}