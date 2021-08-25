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

import { Inject, Service } from '@augu/lilith';
import { HttpClient } from '@augu/orchid';
import { Logger } from 'tslog';
import Config from '../components/Config';

/**
 * Represents a tag service, which is used for [Misu](https://github.com/NinoDiscord/Misu).
 * If the configuration is set to use the Misu API, this service will be used to fetch, edit, recover
 * and delete tags.
 *
 * This is simply a wrapper around the Misu API.
 * @example
 * ```js
 * tags.get('guild', 'name'); // => MisuTag?
 * tags.create({
 *  guild: 'guild',
 *  name: 'name',
 *  author: 'author!',
 *  script: `
 *     return "This is an example of creating the **$(tag.name)** tag.";
 *  `
 * }); // => MisuTag
 *
 * tags.delete('guild', 'name'); // => MisuRecoveryTagDetails
 * tags.recover('recovery id'); // => MisuRecoveryResult
 * ```
 */
@Service({
  priority: 1,
  name: 'misu',
})
export default class TagService {
  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  @Inject
  private readonly http!: HttpClient;
}
