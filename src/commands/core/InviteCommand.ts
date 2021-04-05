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

import { Command, CommandMessage } from '../../structures';
import { Inject, LinkParent } from '@augu/lilith';
import CommandService from '../../services/CommandService';
import Discord from '../../components/Discord';

@LinkParent(CommandService)
export default class InviteCommand extends Command {
  @Inject
  private discord!: Discord;

  constructor() {
    super({
      description: 'descriptions.invite',
      aliases: ['inviteme', 'inv'],
      cooldown: 2,
      name: 'invite'
    });
  }

  run(msg: CommandMessage) {
    return msg.reply([
      ':wave: Wanting to invite me? Use the link below to do so:',
      `<https://discord.com/oauth2/authorize?client_id=${this.discord.client.user.id}&scope=bot>`,
      '',
      ':question: Have questions about me? Join the support server under the #support channel:',
      'https://discord.gg/JjHGR6vhcG'
    ].join('\n'));
  }
}
