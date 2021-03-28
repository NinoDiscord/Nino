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

import type Database from '../../components/Database';
import { ID_REGEX } from '../../util/Constants';
import type Config from '../../components/Config';
import { Router } from '@augu/http';
import app from '../../container';

const router = new Router('/cases');
const database: Database = app.components.get('Database') as Database;
const config: Config = app.components.get('Config') as Config;

router.get('/', (_, res) => res.status(404).send({
  message: 'Missing :guild path param.'
}));

router.get('/:guild', async (req, res) => {
  if (!ID_REGEX.test(req.params.guild))
    return res.status(406).json({
      message: `Guild '${req.params.guild}' was not a Snowflake`
    });

  const secret = config.getProperty('api.secret')!;
  if (req.headers.authorization !== secret)
    return res.status(401).json({
      message: 'You are not authorized to see this information, unfortunately.'
    });

  const cases = await database.cases.getAll(req.params.guild);
  return res.status(200).json(cases);
});

export default router;
