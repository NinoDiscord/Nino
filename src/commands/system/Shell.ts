import { stripIndents } from 'common-tags';
import { execSync } from 'child_process';
import Bot from '../../structures/Bot';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export default class ShellCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'shell',
      description: "Runs a command on the bot's host machine.",
      usage: '<script>',
      aliases: ['exec', 'sh'],
      category: 'System Adminstration',
      ownerOnly: true,
      hidden: true,
    });
  }

  async run(ctx: Context) {
    const message = await ctx.embed(
      this.bot
        .getEmbed()
        .setTitle(':computer: Executing...')
        .build()
    );
    const script = ctx.args.join(' ');
    const time = Date.now();
    let result;
    try {
      result = execSync(script)
        .toString()
        .trim();
      await message.edit({
        embed: this.bot
          .getEmbed()
          .addField(':scroll: Script', `\`\`\`\n${script}\`\`\``, false)
          .addField(
            ':white_check_mark: Result',
            `\`\`\`\n${result}\`\`\``,
            false
          )
          .addField(
            ':alarm_clock: Evaluation Time',
            `**${Date.now() - time}ms**`,
            false
          )
          .build(),
      });
    } catch (ex) {
      await message.edit({
        embed: this.bot
          .getEmbed()
          .addField(':scroll: Script', `\`\`\`\n${script}\`\`\``, false)
          .addField(':white_check_mark: Result', `\`\`\`\n${ex}\`\`\``, false)
          .addField(
            ':alarm_clock: Evaluation Time',
            `**${Date.now() - time}ms**`,
            false
          )
          .build(),
      });
    }
  }
}
