import { injectable, inject } from 'inversify';
import { Constants, Message } from 'eris';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class PruneCommand extends Command {
  public filters: string[] = ['new', 'bot', 'user', 'self', 'image'];
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
    const locale = await ctx.getLocale();
    if (!ctx.args.has(0)) return ctx.send(locale.translate('commands.moderation.prune.noAmount'));

    const arg = ctx.args.get(0);
    const amount = Number(arg);

    if (isNaN(amount)) return ctx.send(locale.translate('global.nan'));
    if (amount < 2) return ctx.send(locale.translate('commands.moderation.prune.tooLow'));
    if (amount > 100) return ctx.send(locale.translate('commands.moderation.prune.tooHigh'));

    const allMsgs = await ctx.message.channel.getMessages(amount);
    const filter = ctx.flags.get('filter') || ctx.flags.get('f');

    if (typeof filter === 'boolean') return ctx.send(locale.translate('global.invalidFlag.boolean'));
    if (filter && !this.filters.includes(filter)) return ctx.send(locale.translate('commands.moderation.prune.invalidFilter', {
      filters: this.filters.join(', '),
      filter
    }));

    const shouldDelete = allMsgs.filter(x => 
      (filter === 'user' ? !x.author.bot : false) &&
      (filter === 'self' ? x.author.id === this.bot.client.user.id : false) &&
      (filter === 'bot' ? x.author.bot : false) &&
      (filter === 'new' ? x.timestamp > this.weeks : false) &&
      (filter === 'image' ? x.attachments.length : false)
    );

    if (!shouldDelete.length) return ctx.send(locale.translate('commands.moderation.prune.noMessages', { filter }));
    const message = await ctx.send(locale.translate('commands.moderation.prune.nowDel', { messages: shouldDelete.length }));

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
        return locale.translate('commands.moderation.prune.userEntry', {
          messages,
          suffix: messages > 1 ? 's' : '',
          user: `${author.username}#${author.discriminator}`
        });
      }).join('\n');

      const embed = this.bot.getEmbed()
        .setAuthor(locale.translate('commands.moderation.prune.title'))
        .setDescription(stripIndents`
          \`\`\`prolog
          ${allUsers}
          \`\`\`
        `);

      await message.delete();
      return ctx.embed(embed.build());
    } catch(ex) {
      if (ex.message.includes(' is more then 2 weeks old.')) {
        const messages = shouldDelete.filter(x => x.timestamp < this.weeks);
        return ctx.send(locale.translate('commands.moderation.prune.tooWeeks', { messages: messages.length }));
      } else {
        const embed = this.bot.getEmbed()
          .setTitle(locale.translate('commands.moderation.prune.error.title'))
          .setDescription(stripIndents`
            \`\`\`js
            ${ex.stack ? ex.stack.split('\n').slice(0, 3).join('\n') : ex.message}
            \`\`\`
          `);
        
        return ctx.embed(embed.build());
      }
    }
  }
}