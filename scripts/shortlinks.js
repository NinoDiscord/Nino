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

const { LoggerWithoutCallSite } = require('tslog');
const { calculateHRTime } = require('@augu/utils');
const { existsSync } = require('fs');
const { HttpClient } = require('@augu/orchid');
const { version } = require('../package.json');
const { join } = require('path');
const fs = require('fs/promises');

const http = new HttpClient({
  userAgent: `Nino/DiscordBot (https://github.com/NinoDiscord/Nino, v${version})`
});

const logger = new LoggerWithoutCallSite({
  displayFunctionName: true,
  exposeErrorCodeFrame: true,
  displayInstanceName: true,
  displayFilePath: false,
  dateTimePattern: '[ day-month-year / hour:minute:second ]',
  instanceName: 'script: shortlinks',
  name: 'scripts'
});

const otherUrls = [
  'shorte.st',
  'adf.ly',
  'bc.vc',
  'soo.gd',
  'ouo.io',
  'zzb.bz',
  'adfoc.us',
  'goo.gl',
  'grabify.link',
  'shorturl.at',
  'tinyurl.com',
  'tinyurl.one',
  'rotf.lol',
  'bit.do',
  'is.gd',
  'owl.ly',
  'buff.ly',
  'mcaf.ee',
  'su.pr',
  'bfy.tw',
  'owo.vc',
  'tiny.cc',
  'rb.gy',
  'bl.ink',
  'v.gd',
  'vurl.com',
  'turl.ca',
  'shrunken.com',
  'p.asia',
  'g.asia',
  '3.ly',
  '0.gp',
  '2.ly',
  '4.gp',
  '4.ly',
  '6.ly',
  '7.ly',
  '8.ly',
  '9.ly',
  '2.gp',
  '6.gp',
  '5.gp',
  'ur3.us',
  'kek.gg',
  'waa.ai',
  'steamcommunity.ru',
  'steanconmunity.ru'
];

const startTime = process.hrtime();
(async() => {
  logger.info('Now reading list from https://raw.githubusercontent.com/sambokai/ShortURL-Services-List/master/shorturl-services-list.csv...');

  const requestTime = process.hrtime();
  const res = await http.get('https://raw.githubusercontent.com/sambokai/ShortURL-Services-List/master/shorturl-services-list.csv');

  const requestEnd = calculateHRTime(requestTime);
  logger.debug(`It took ~${requestEnd}ms to get a "${res.statusCode}" response.`);

  const data = res.body().split(/\n\r?/);
  data.shift();

  const shortlinks = [...new Set([].concat(data.map(s => s.slice(0, s.length - 1)), otherUrls))].filter(s => s !== '');
  if (!existsSync(join(__dirname, '..', 'assets')))
    await fs.mkdir(join(__dirname, '..', 'assets'));

  await fs.writeFile(join(__dirname, '..', 'assets', 'shortlinks.json'), `${JSON.stringify(shortlinks, null, '\t')}\n`);
  logger.info(`It took about ~${calculateHRTime(startTime)}ms to retrieve ${shortlinks.length} short-links.`);
  process.exit(0);
})();
