import { Constants, Message, TextableChannel } from 'eris';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import { createEmptyEmbed } from '../../util/EmbedUtils';

@injectable()
export default class PruneCommand extends Command {
  public filters: string[] = ['none', 'new', 'bot', 'user', 'self', 'image'];
  public weeks: number = Date.now() - (1000 * 60 * 60 * 24 * 14);

  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'prune',
      description: 'Prunes messages by a filter from the current or a different channel',
      usage: '<amount> [--filter="bot" | "user" | "new" | "self"]',
      aliases: ['purge', 'delmsg'],
      category: Module.Moderation,
      userPermissions: Constants.Permissions.manageMessages,
      botPermissions: Constants.Permissions.manageMessages,
      guildOnly: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('commands.moderation.prune.noAmount');

    const arg = ctx.args.get(0);
    const amount = Number(arg);

    if (isNaN(amount)) return ctx.sendTranslate('global.nan');
    if (amount < 2) return ctx.sendTranslate('commands.moderation.prune.tooLow');
    if (amount > 100) return ctx.sendTranslate('commands.moderation.prune.tooHigh');

    const allMsgs = await ctx.message.channel.getMessages(amount);
    const filter = ctx.flags.get('filter') || ctx.flags.get('f');

    if (typeof filter === 'boolean') return ctx.sendTranslate('global.invalidFlag.boolean');
    if (filter && !this.filters.includes(filter)) return ctx.sendTranslate('commands.moderation.prune.invalidFilter', {
      filters: this.filters.join(', '),
      filter
    });

    const shouldDelete = (allMsgs as Message<TextableChannel>[]).filter((x: Message<TextableChannel>) => 
      !filter || filter === 'none' ||
      (filter === 'user' ? !x.author.bot : false) ||
      (filter === 'self' ? x.author.id === this.bot.client.user.id : false) ||
      (filter === 'bot' ? x.author.bot : false) ||
      (filter === 'new' ? x.timestamp > this.weeks : false) ||
      (filter === 'image' ? x.attachments.length : false)
    );

    if (!shouldDelete.length) return ctx.sendTranslate('commands.moderation.prune.noMessages', { filter });
    const message = await ctx.sendTranslate('commands.moderation.prune.nowDel', { messages: shouldDelete.length });

    try {
      await this.bot.client.deleteMessages(ctx.channel.id, shouldDelete.map(s => s.id), `User ${ctx.sender.username}#${ctx.sender.discriminator} requested it`);
      const msgs: string[] = [];

      // This looks ugly but it's gonna have to do I guess?
      shouldDelete.map(x => {
        if (!msgs.includes(x.author.id)) msgs.push(x.author.id);
      });

      const allUsers = msgs.map(x => {
        const author = this.bot.client.users.get(x)!;
        const messages = shouldDelete.filter(e => e.author.id === x).length;
        return ctx.translate('commands.moderation.prune.userEntry', {
          messages,
          suffix: messages > 1 ? 's' : '',
          user: `${author.username}#${author.discriminator}`
        });
      }).join('\n');

      const embed = createEmptyEmbed()
        .setAuthor(ctx.translate('commands.moderation.prune.title'))
        .setDescription(allUsers);

      await message.delete();
      return ctx.embed(embed.build());
    } catch(ex) {
      if (ex.message.includes(' is more then 2 weeks old.')) {
        const messages = shouldDelete.filter(x => x.timestamp < this.weeks);
        return ctx.sendTranslate('commands.moderation.prune.twoWeeks', { messages: messages.length });
      } else {
        const embed = createEmptyEmbed()
          .setTitle(ctx.translate('commands.moderation.prune.error.title'))
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
