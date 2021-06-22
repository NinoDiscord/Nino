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

import { Request, Response, Router } from 'express';
import session from 'express-session';
import API from '../API';

export const SourceResource: {
  [X in 'discord.services' | 'discord.boats' | 'discord.bots.gg' | 'top.gg' | 'delly' | 'botsfordiscord' | 'invite' | 'website']: string;
} = {
  'discord.services': 'nino:botlists:discord-services',
  'discord.bots.gg': 'nino:botlists:dbots',
  'botsfordiscord': 'nino:botlists:bfd',
  'discord.boats': 'nino:botlists:dboats',
  'top.gg': 'nino:botlists:dbl',
  invite: 'nino:botlists:invite',
  website: 'nino:botlists:website',
  delly: 'nino:botlists:cutebflist'
};

export default function oauth2(api: API) {
  const router = Router();
  router
    .use(session({
      secret: api['config'].getProperty('api')!.secret
    }))
    .get('/discord', discordRedirect)
    .get('/discord/callback', () => {
      // todo: this
    });

  api.app.use(router);
}

const discordRedirect = (req: Request, res: Response) => {
  // Will return one of the following:
  const source = req.query.source;
  // todo: this
};
