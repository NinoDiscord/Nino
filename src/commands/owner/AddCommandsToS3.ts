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
import { Categories } from '../../util/Constants';
import { Stopwatch } from '@augu/utils';
import { Inject } from '@augu/lilith';
import S3 from '../../components/S3';

export default class AddCommandsToS3 extends Command {
  @Inject
  private readonly s3!: S3;

  constructor() {
    super({
      description: "Bulk adds commands to Noel's S3 bucket",
      ownerOnly: true,
      category: Categories.Owner,
      aliases: ['bulk:s3'],
      name: 'commands:s3',
    });
  }

  async run(msg: CommandMessage) {
    if (!this.s3.client) return msg.reply("S3 client isn't attached.");

    const message = await msg.reply('Now uploading commands to S3...');
    const stopwatch = new Stopwatch();
    stopwatch.start();

    await this.s3.publishCommands();
    const endTime = stopwatch.end();

    return message.edit(
      `:timer: Took ~**${endTime}** to upload commands to S3.`
    );
  }
}
