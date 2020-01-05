import { Constants } from 'eris';
import { stripIndents } from 'common-tags';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

const weeks = Date.now() - 1000 * 60 * 60 * 24 * 14;

@injectable()
export default class PruneCommand extends Command {
  public filters: string[];

  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'prune',
      description: 'Prunes messages from the current channel',
      usage: '<amount> [--filter=\'bot\' | \'user\' | \'new\']',
      aliases: ['purge'],
      category: 'Moderation',
      userpermissions: Constants.Permissions.manageMessages,
      botpermissions: Constants.Permissions.manageMessages,
    });

    this.filters = ['bot', 'user', 'new'];
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0))
      return ctx.send(
        'You must provide 1-2 arguments. Check the command usage.'
      );

    const arg = ctx.args.get(0);
    if (Number(arg) < 2)
      return ctx.send('The `amount` must be greater or equal to 2.');
    if (Number(arg) > 100)
      return ctx.send('The `amount` must be less then or equal to 100.');

    const messages = await ctx.message.channel.getMessages(Number(arg));
    const filter = ctx.flags.get('filter') || ctx.flags.get('f');
    if (typeof filter === 'boolean')
      return ctx.send('The `filter` flag must be a string.');
    if (!!filter && !this.filters.includes(filter))
      return ctx.send(
        `Invalid filter. (\`${this.filters.map(s => s).join(', ')}\`)`
      );

    const toDelete = messages.filter(
      m =>
        (filter === 'bot' ? m.author.bot : true) &&
        (filter === 'user' ? !m.author.bot : true) &&
        (filter === 'new' ? m.timestamp > weeks : true)
    );
    if (toDelete.length < 1)
      return ctx.send('No messages was found by the `' + filter + '` filter!');

    try {
      toDelete.map(async m => await ctx.message.channel.deleteMessage(m.id));
      return ctx.send(`I've deleted \`${toDelete.length}\` messages!`);
    }
    catch (ex) {
      if (ex.message.includes(' is more then 2 weeks old.')) {
        const m = toDelete.filter(m => m.timestamp < weeks);
        return ctx.send(
          `There were ${m.length} messages that I c-cant delete because Discord puts messages at bulk after 2 weeks has past.`
        );
      }
      else {
        return ctx.code(
          'js',
          stripIndents`
                    // Unable to delete messages because of:
                    ${ex.stack.split('\n')[0]}
                    ${ex.stack.split('\n')[1]}
                    ${ex.stack.split('\n')[2]}
                    ${ex.stack.split('\n')[3]}
                `
        );
      }
    }
  }
}
