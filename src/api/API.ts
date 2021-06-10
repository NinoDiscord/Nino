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

import { Component, ComponentAPI, Container, Inject } from '@augu/lilith';
import { HelloResolver } from './resolvers/HelloResolver';
import { ApolloServer } from 'apollo-server-fastify';
import { buildSchema } from 'type-graphql';
import type Database from '../components/Database';
import { Logger } from 'tslog';
import { join } from 'path';
import Config from '../components/Config';
import fastify from 'fastify';

export interface NinoContext {
  container: Container;
  database: Database;
}

@Component({
  priority: 2,
  children: join(process.cwd(), 'endpoints'),
  name: 'api'
})
export default class API {
  private readonly api!: ComponentAPI;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;
  #server!: ReturnType<typeof fastify>;
  #apollo!: ApolloServer;

  async load() {
    const api = this.config.getProperty('api');
    if (api === undefined) {
      this.logger.info('GraphQL API is not enabled, so not creating this component.');
      return Promise.resolve();
    }

    this.logger.info('Launching API...');
    const schema = await buildSchema({
      resolvers: [HelloResolver]
    });

    this.#apollo = new ApolloServer({
      schema,
      context: () => ({
        container: this.api.container,
        database: this.api.getComponent('database')
      })
    });

    // API content
    this.#server = fastify();
    this.#server.register(require('fastify-cors')).register(require('fastify-no-icon'));

    // Start apollo
    await this.#apollo.start();
    this.#server.register(this.#apollo.createHandler());

    return this.#server.listen({
      port: 3089
    }, (error, address) => {
      if (error) {
        this.logger.fatal('Unable to listen on :3089\n', error);
        process.exit(1);
      }

      this.logger.info(`🚀✨ API is now listening at ${address}`);
    });
  }

  dispose() {
    return this.#server.close();
  }
}
