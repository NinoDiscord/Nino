import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { execSync } from 'child_process';
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
      category: 'System Adminstration',
      ownerOnly: true,
      hidden: true,
    });
  }

  async run(ctx: Context) {
    const message = await ctx.send('Evaluating script...');
    const script = ctx.args.join(' ');
    let result: string;
    try {
      result = execSync(script)
        .toString()
        .trim();

      await message.edit(stripIndents`
        > :pencil2: **Script was evaluated successfully, here is the result:**
        \`\`\`sh
        ${result}
        \`\`\`
      `);
    } catch (ex) {
      await message.edit(stripIndents`
        > :x: **Unable to evaluate script:**
        \`\`\`sh
        ${ex.message}
        \`\`\`
      `);
    }
  }
}
