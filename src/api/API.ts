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
import { Component, Inject, PendingInjectDefinition } from '@augu/lilith';
import { HttpServer, middleware, Router } from '@augu/http';
import type { RouteDefinition } from './decorators';
import { MetadataKeys } from '../util/Constants';
import { Logger } from 'tslog';
import { join } from 'path';
import express from 'express';
import Config from '../components/Config';

interface RouterCtor {
  default: ConstructorReturnType<Ctor<Router>>;
}

@Component({
  priority: 2,
  name: 'api'
})
export default class API {
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
      return Promise.resolve();
    }

    this.logger.info('Now launching API...');
    this.server = new HttpServer({
      port: api.port
    });

    this.server.app.use(express.json());
    this.server.app.use(middleware.headers());
    this.server.app.use(middleware.logging().bind(this.server));

    const routers = readdirSync(join(process.cwd(), 'api', 'routers'));
    for (let i = 0; i < routers.length; i++) {
      const path = routers[i];
      const ctor: RouterCtor = await import(path);

      // Run the injections
      app.runInjections();

      // @ts-ignore
      const router: Router = new ctor.default!();
      const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, router) ?? [];
      this.logger.info(`Found ${routes.length} routes for router ${router.prefix}`);
      for (const route of routes) {
        router[route.method](route.path, async (req, res) => {
          try {
            await route.run.call(router, req, res);
          } catch(ex) {
            this.logger.error(`Unable to run route "${route.method.toUpperCase()} ${route.path}"`, ex);
            return res.status(500).json({
              message: `An unexpected error has occured while running "${route.method.toUpperCase()} ${route.path}". Contact the owners in #support under the Nino category at discord.gg/ATmjFH9kMH if this continues.`
            });
          }
        });
      }

      this.logger.info(`✔ Initialized ${routes.length} routes to router ${router.prefix}`);
      this.server.router(router);
    }

    this.server.on('listening', (networks) =>
      this.logger.info('API service is now listening on the following URLs:\n', networks.map(network => `• ${firstUpper(network.type)} | ${network.host}`).join('\n'))
    );

    this.server.on('request', (props) =>
      this.logger.debug(`API: ${props.method} ${props.path} (${props.status}) | ~${props.time}ms`)
    );

    this.server.on('debug', message => this.logger.debug(`API: ${message}`));
    this.server.on('error', error => this.logger.fatal(error));
    return this.server.start();
  }

  dispose() {
    return this.server.close();
  }
}
