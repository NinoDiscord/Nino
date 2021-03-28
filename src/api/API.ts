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

import { ConstructorReturnType, Ctor, firstUpper, readdirSync } from '@augu/utils';
import { HttpServer, middleware, Router } from '@augu/http';
import { Component, Inject } from '@augu/lilith';
import { Logger } from 'tslog';
import { join } from 'path';
import Config from '../components/Config';

interface RouterCtor {
  default: ConstructorReturnType<Ctor<Router>>;
}

export default class API implements Component {
  private server!: HttpServer;
  public priority: number = 2;
  public name: string = 'API';

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  async load() {
    const api = this.config.getProperty('api');
    if (api === undefined) {
      this.logger.info('API is not gonna be enabled.');
      return Promise.resolve(); // resolve the promise idfk
    }

    this.logger.info('Now launching API...');
    this.server = new HttpServer({
      port: api.port
    });

    this.server.app.use(middleware.headers());
    this.server.app.use(middleware.logging().bind(this.server));

    const routers = readdirSync(join(process.cwd(), 'api', 'routers'));
    for (let i = 0; i < routers.length; i++) {
      const path = routers[i];
      const ctor: RouterCtor = await import(path);

      this.server.router(ctor.default);
    }

    this.server.on('listening', (networks) =>
      this.logger.info('API service is now listening on the following URLs:\n', networks.map(network => `• ${firstUpper(network.type)} | ${network.host}`).join('\n'))
    );

    this.server.on('request', (props) =>
      this.logger.debug(`API: ${props.method} ${props.path} (${props.status}) | ${props.time}ms`)
    );

    this.server.on('debug', message => this.logger.debug(`API: ${message}`));
    this.server.on('error', error => this.logger.fatal(error));
    return this.server.start();
  }

  dispose() {
    return this.server.close();
  }
}
