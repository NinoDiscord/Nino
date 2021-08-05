/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Command, CommandMessage, EmbedBuilder, Subcommand } from '../../structures';
import { Inject } from '@augu/lilith';
import { Categories, DISCORD_INVITE_REGEX, ID_REGEX } from '../../util/Constants';
import Discord from '../../components/Discord';
import { Message, User } from 'eris';
import { pluralize } from '@augu/utils';

// It's a function so it can properly hydrate instead of being in the command scope as a getter.
const getTwoWeeksFromNow = () => Date.now() - 1000 * 60 * 60 * 24 * 14;

export default class PurgeCommand extends Command {
  @Inject
  private readonly discord!: Discord;

  constructor() {
    super({
      userPermissions: ['manageMessages'],
      botPermissions: ['manageMessages'],
      description: 'descriptions.purge',
      examples: [
        'prune | Automatically delete 100 messages from this channel',
        'prune 6 | Delete 6 messages from the channel',
        'prune August#5820 5 | Removes messages that **August** has said. (do not actually do this)',
        'prune self 6 | Removes 6 messages that I have said',
        'prune system | Prunes all system-related messages',
        'prune attachments | Prunes all messages with attachments',
      ],
      aliases: ['prune', 'delmsgs', 'delmsg'],
      category: Categories.Moderation,
      usage: '<userID> [amount] | <before[-after]> | [amount]',
      name: 'purge',
    });
  }

  private _generateEmbed(msg: CommandMessage, messages: Message[]) {
    // removes duplicated ids (so it doesn't look garbage (i.e: https://github.com/NinoDiscord/Nino/blob/56290f3cce32ec8376d704ab510a10bdeea7fa7a/src/commands/moderation/Prune.ts#L64))
    const users = [...new Set(messages.map((s) => s.author.id))];
    return EmbedBuilder.create()
      .setAuthor(`[ ${msg.author.username}#${msg.author.discriminator} ~ Purge Result ]`, '', msg.author.dynamicAvatarURL('png', 1024))
      .setDescription([
        `${msg.successEmote} I have deleted **${pluralize('message', messages.length)}** from this channel.`,
        '> 👤 **Users Affected**',
        '```apache',
        users
          .map((user) => {
            const u = this.discord.client.users.get(user) ?? {
              username: 'Unknown User',
              discriminator: '0000',
              id: user,
              bot: false,
            };
            const messagesByUser = messages.filter((c) => c.author.id === user);
            const percentage = ((messagesByUser.length / messages.length) * 100).toFixed();

            return `• ${u.username}#${u.discriminator}${u.bot ? ' (Bot)' : ''} (${u.id}) - ${percentage}% deleted`;
          })
          .join('\n'),
        '```',
      ]);
  }

  async run(msg: CommandMessage, [userIdOrAmount, amount]: [string, string?]) {
    if (!userIdOrAmount) {
      await msg.reply('Now purging 100 messages from this channel...');

      const messages = await msg.channel.getMessages({ limit: 100 }).then((f) => f.filter((c) => c.timestamp >= getTwoWeeksFromNow()));
      if (!messages.length) return msg.error('No messages were found that is under 2 weeks?');

      await this.discord.client.deleteMessages(
        /* channelID */ msg.channel.id,
        /* messages */ messages.map((i) => i.id),
        /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command.`
      );

      return msg.reply(this._generateEmbed(msg, messages));
    }

    const user = await this.discord.getUser(userIdOrAmount).catch(() => null);
    if (user !== null) return this._deleteByUser(msg, user.id, amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : 50);
    else
      return this._deleteAmount(
        msg,
        !isNaN(Number(userIdOrAmount)) ? Number(userIdOrAmount) : amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : 50
      );
  }

  private async _deleteByUser(msg: CommandMessage, userID: string, amount?: number) {
    const amountToDelete = amount ?? 50;
    if (amountToDelete > 100) return msg.reply(`Cannot delete more or equal to 100 messages. (went over **${amountToDelete - 100}**.)`);

    const messages = await msg.channel
      .getMessages({ limit: amountToDelete })
      .then((messages) => messages.filter((m) => m.author.id === userID && m.timestamp >= getTwoWeeksFromNow()));
    if (!messages.length) return msg.error('No messages were found that is under 2 weeks?');

    if (amountToDelete === 1) {
      const message = messages[0];
      await message.delete();

      return msg.success('Deleted one message.');
    }

    const user = (await this.discord.getUser(userID)) as User;
    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete ${amountToDelete} messages from ${user.username}#${user.discriminator})`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }

  private async _deleteAmount(msg: CommandMessage, amount: number) {
    if (amount > 100) return msg.reply(`Cannot delete more or equal to 100 messages. (went over **${amount - 100}**.)`);

    const messages = await msg.channel.getMessages({ limit: amount }).then((m) => m.filter((c) => c.timestamp > getTwoWeeksFromNow()));
    if (!messages.length) return msg.error('No messages were found that is under 2 weeks?');

    if (amount === 1) {
      const message = messages[0];
      await message.delete();

      return msg.success('Deleted the previous message');
    }

    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete ${amount} messages from all users)`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }

  @Subcommand('[amount]', ['images', 'imgs'])
  async attachments(msg: CommandMessage, [amount]: [string?]) {
    const toDelete = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : 50;
    if (toDelete > 100) return msg.reply(`Cannot delete more or equal to 100 messages. (went over **${toDelete - 100}**.)`);

    const messages = await msg.channel
      .getMessages({ limit: toDelete })
      .then((m) => m.filter((c) => c.attachments.length > 0).filter((c) => c.timestamp > getTwoWeeksFromNow()));
    if (toDelete === 1) {
      const message = messages[0];
      await message.delete();

      return msg.success('Deleted one message.');
    }

    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete ${toDelete} messages with attachments)`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }

  @Subcommand()
  async system(msg: CommandMessage) {
    const messages = await msg.channel
      .getMessages({ limit: 10 })
      .then((m) => m.filter((c) => c.author.system).filter((c) => c.timestamp > getTwoWeeksFromNow()));
    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete 10 messages that are system-related)`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }

  @Subcommand()
  async invites(msg: CommandMessage) {
    const messages = await msg.channel
      .getMessages({ limit: 10 })
      .then((m) => m.filter((c) => DISCORD_INVITE_REGEX.test(c.content)).filter((c) => c.timestamp > getTwoWeeksFromNow()));
    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete 10 messages that are system-related)`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }

  @Subcommand('[amount]')
  async self(msg: CommandMessage, [amount]: [string?]) {
    const toDelete = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : 50;
    if (toDelete > 100) return msg.reply(`Cannot delete more or equal to 100 messages. (went over **${toDelete - 100}**.)`);

    const messages = await msg.channel
      .getMessages({ limit: toDelete })
      .then((m) => m.filter((c) => c.author.id === this.discord.client.user.id).filter((c) => c.timestamp > getTwoWeeksFromNow()));
    if (toDelete === 1) {
      const message = messages[0];
      await message.delete();

      return msg.success('Deleted one message.');
    }

    await this.discord.client.deleteMessages(
      /* channelID */ msg.channel.id,
      /* messages */ messages.map((i) => i.id),
      /* reason */ `[Purge] User ${msg.author.username}#${msg.author.discriminator} ran the \`purge\` command. (used to delete ${toDelete} messages that I said)`
    );

    return msg.reply(this._generateEmbed(msg, messages));
  }
}
