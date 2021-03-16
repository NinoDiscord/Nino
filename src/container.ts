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

import { Application } from '@augu/lilith';
import { join } from 'path';
import logger from './singletons/Logger';

const app = new Application()
  .findComponentsIn(join(__dirname, 'components'))
  .findServicesIn(join(__dirname, 'services'));

app.on('component.initializing', component => logger.debug(`Component ${component.name} is being initialized...`));
app.on('component.loaded', component => logger.info(`Component ${component.name} has been initialized successfully!`));

app.on('service.initializing', service => logger.debug(`Service ${service.name} is being initialized...`));
app.on('service.loaded', service => logger.info(`Service ${service.name} has been initialized!`));

app.on('debug', message => logger.debug(`Lilith: ${message}`));

app.addSingleton(logger);

export default app;
