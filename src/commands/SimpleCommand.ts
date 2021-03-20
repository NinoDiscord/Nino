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

import type CommandMessage from '../structures/CommandMessage';
import { Inject } from '@augu/lilith';
import Kubernetes from '../components/Kubernetes';
import Command from '../structures/Command';

export default class SimpleCommand extends Command {
  constructor() {
    super({
      description: 'A simple command for your needs.',
      args: [
        {
          name: 'node',
          type: 'string',
          default: 'us-dedi1'
        },
        {
          name: 'uwu',
          type: 'int',
          default: 69
        }
      ],
      name: 'simple'
    });
  }

  @Inject
  private k8s!: Kubernetes;

  async run(msg: CommandMessage, args: { node: string; uwu: number }) {
    const nodes = await this.k8s.getCurrentNodes();
    if (Object.keys(args).length > 0) {
      return msg.reply(`node provided: **${args.node}**\nuwu provided: ${args.uwu}`);
    }

    if (nodes.length === 0)
      return msg.reply('unable to list nodes due to no kubernetes namespace!');

    return msg.reply(`~ Current Nodes ~\n\`\`\`apache\n${nodes.map(node => `[${node.name} | ${node.node}] ${typeof node.createdAt === 'string' ? 'malformed date!' : node.createdAt.toUTCString()}`).join('\n')}\n\`\`\``);
  }
}
