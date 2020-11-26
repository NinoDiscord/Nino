import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { execSync } from 'child_process';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ShellCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'shell',
      description: 'Runs a command on the bot\'s host machine.',
      usage: '<script>',
      aliases: ['exec', 'sh'],
      category: Module.System,
      ownerOnly: true,
      hidden: true
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.get(0)) return ctx.send('What am I supposed to execute?');

    let script = ctx.args.join(' ');
    let result: string;

    if (script.startsWith('"') && script.endsWith('"')) {
      script = script.replace(/"/g, '');
      script = script.replace(/"/g, '');
    }

    try {
      result = execSync(script, { encoding: 'utf-8' });

      await ctx.send(stripIndents`
        \`\`\`sh
        ${this.redact(result)}
        \`\`\`
      `);
    } catch (ex) {
      await ctx.send(stripIndents`
        \`\`\`sh
        ${ex.stack || 'None'}
        \`\`\`
      `);
    }
  }

  redact(script: string) {
    let tokens = [
      this.bot.client.token,
      this.bot.config.databaseUrl,
      this.bot.config.discord.token,
      this.bot.config.redis.host,
      this.bot.config.sentryDSN
    ];

    if (this.bot.config.ksoft) tokens.push(this.bot.config.ksoft);
    if (this.bot.config.botlists) tokens.push(this.bot.config.botlists.bfdtoken, this.bot.config.botlists.blstoken, this.bot.config.botlists.topggtoken, this.bot.config.botlists.dboatstoken, this.bot.config.botlists.dservicestoken, this.bot.config.botlists.deltoken);
    if (this.bot.config.dbAuth) tokens.push(this.bot.config.dbAuth.password);

    tokens = tokens.filter(Boolean);
    const cancellationToken = new RegExp(tokens.join('|'), 'gi');
    return script.replace(cancellationToken, '--snip--');
  }
}