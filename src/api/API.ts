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

/* eslint-disable camelcase */

import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { Component, Inject } from '@augu/lilith';
import LocalizationService from '../services/LocalizationService';
import CommandService from '../services/CommandService';
import { pluralize } from '@augu/utils';
import { Logger } from 'tslog';
import Config from '../components/Config';

@Component({
  priority: 0,
  name: 'api',
})
export default class API {
  @Inject
  private readonly localization!: LocalizationService;

  @Inject
  private readonly commands!: CommandService;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;
  private instance!: ReturnType<typeof fastify>;

  async load() {
    const enabled = this.config.getProperty('api');
    if (!enabled) {
      this.logger.warn("Internal API is not enabled, this isn't recommended on self-hosted instances.");
      return;
    }

    const server = fastify();
    server.register(require('fastify-no-icon'));

    this.instance = server;
    this.setupRoutes();

    let resolver!: any;
    let rejecter!: any;

    const promise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    server.listen(22345, (error, address) => {
      if (error) return rejecter(error);

      this.logger.info(`🚀 Launched internal API on ${address}`);
      resolver();
    });

    return promise;
  }

  private setupRoutes() {
    this.logger.info('🚀 Setting up routing...');

    this.instance
      .get('/', (_, res) => void res.redirect('https://nino.sh'))
      .get('/commands', (req, res) => {
        this._handleAllCommandsRoute.call(this, req, res);
      })
      .get('/commands/:name', (req, res) => {
        this._handleSingleCommandLookup.call(this, req, res);
      });
  }

  private _handleAllCommandsRoute(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<'locale' | 'l', string>;
    let locale =
      query['l'] !== undefined || query['locale'] !== undefined
        ? this.localization.locales.find(
            (l) =>
              l.code === query.l ||
              l.code === query.locale ||
              l.aliases.includes(query.l) ||
              l.aliases.includes(query.locale)
          )
        : this.localization.defaultLocale;

    if (locale === null) locale = this.localization.defaultLocale;

    const prefix = this.config.getProperty('prefixes')?.[0] ?? 'x!';
    const commands = this.commands
      .filter((s) => !s.ownerOnly || !s.hidden)
      .map((command) => ({
        name: command.name,
        description: locale!.translate(command.description),
        examples: command.examples.map((s) => `${prefix}${s}`),
        usage: command.format,
        aliases: command.aliases,
        cooldown: pluralize('second', command.cooldown),
        category: command.category,
        user_permissions: command.userPermissions,
        bot_permissions: command.botPermissions,
      }));

    return reply.status(200).send(commands);
  }

  private _handleSingleCommandLookup(req: FastifyRequest, reply: FastifyReply) {
    const query = (req.query as Record<'locale' | 'l', string>) ?? ({} as Record<'locale' | 'l', string>);
    const params = req.params as Record<'name', string>;
    let locale =
      query['l'] !== undefined || query['locale'] !== undefined
        ? this.localization.locales.find(
            (l) =>
              l.code === query.l ||
              l.code === query.locale ||
              l.aliases.includes(query.l) ||
              l.aliases.includes(query.locale)
          )
        : this.localization.defaultLocale;

    if (locale === null) locale = this.localization.defaultLocale;

    const prefix = this.config.getProperty('prefixes')?.[0] ?? 'x!';
    const command = this.commands.filter((s) => !s.ownerOnly || !s.hidden).filter((s) => s.name === params.name)[0];
    if (!command)
      return void reply.status(404).send({
        message: `Command ${params.name} was not found.`,
      });

    return void reply.status(200).send({
      name: command.name,
      description: command.description,
      examples: command.examples.map((s) => `${prefix}${s}`),
      usage: command.format,
      aliases: command.aliases,
      cooldown: pluralize('second', command.cooldown),
      category: command.category,
      user_permissions: command.userPermissions,
      bot_permissions: command.botPermissions,
    });
  }
}
