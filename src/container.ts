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
import consola from 'consola';
import http from '~/singletons/http';

const logger = consola.withScope('nino:lilith');
const container = new Container({
  componentsDir: join(process.cwd(), 'components'),
  servicesDir: join(process.cwd(), 'services'),
  singletons: [http, () => import('~/singletons/prisma')],
});

container
  .on('onBeforeChildInit', (cls, child) =>
    logger.debug(`Initializing child ${child.constructor.name} from parent ${cls.name}...`)
  )
  .on('onAfterChildInit', (cls, child) =>
    logger.debug(`Initialized child ${child.constructor.name} from parent ${cls.name}!`)
  )
  .on('onBeforeInit', (cls) => logger.debug(`Now initializing ${cls.type} ${cls.name}...`))
  .on('onAfterInit', (cls) => logger.debug(`Initialized ${cls.type} ${cls.name}!`));

if (process.env.NODE_ENV === 'development') {
  container.on('debug', (msg) => logger.debug(`lilith:debug -> ${msg}`));
}

(global as any).container = container;
export default container;
