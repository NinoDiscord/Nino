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

import { Container } from '@augu/lilith';
import { join } from 'path';
import logger from './singletons/Logger';
import http from './singletons/Http';

const app = new Container({
  componentsDir: join(__dirname, 'components'),
  servicesDir: join(__dirname, 'services'),
  singletons: [http, logger]
});

app.on('onBeforeChildInit', (cls, child) => logger.debug(`>> ${cls.name}->${child.constructor.name}: initializing...`));
app.on('onAfterChildInit', (cls, child) => logger.debug(`>> ✔ ${cls.name}->${child.constructor.name}: initialized`));
app.on('onBeforeInit', cls => logger.debug(`>> ${cls.name}: initializing...`));
app.on('onAfterInit', cls => logger.debug(`>> ✔ ${cls.name}: initialized`));
app.on('debug', message => logger.debug(`lilith: ${message}`));

app.on('initError', console.error);
app.on('childInitError', console.error);

(global as any).app = app;
export default app;
