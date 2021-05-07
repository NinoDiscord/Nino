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

import { Get, Patch, Put, Delete } from '../decorators';
import type { Request, Response } from 'express';
import { Inject, LinkParent } from '@augu/lilith';
import { Router } from '@augu/http';
import Database from '../../components/Database';
import Discord from '../../components/Discord';
import Api from '../API';

@LinkParent(Api)
export default class GuildsRouter extends Router {
  @Inject
  private database!: Database;

  @Inject
  private discord!: Discord;

  constructor() {
    super('/guilds');
  }

  @Get('/')
  main(_: Request, res: Response) {
    return res.status(204).end();
  }

  @Get('/:id')
  async guildGet(req: Request, res: Response) {
    const guild = await this.database.guilds.get(req.params.id, false);
    const statusCode = guild === undefined ? 404 : 200;
    const data = statusCode === 404 ? { message: `Guild by ID '${req.params.id}' was not found` } : guild;

    return res.status(statusCode).json(data);
  }

  @Get('/:id/automod')
  async getGuildAutomod(req: Request, res: Response) {
    const automod = await this.database.automod.get(req.params.id);
    const statusCode = automod === undefined ? 404 : 200;
    const resp = statusCode === 404 ? {
      message: `Guild with ID "${req.params.id}" was not found.`
    } : automod;

    return res.status(statusCode).json(resp);
  }

  @Get('/:id/punishments')
  async getGuildPunishments(req: Request, res: Response) {
    const data = await this.database.punishments.getAll(req.params.id);
    const statusCode = data === undefined ? 404 : 200;
    const resp = statusCode === 404 ? {
      message: `Guild with ID "${req.params.id}" was not found.`
    } : data;

    return res.status(statusCode).json(resp);
  }

  @Get('/:id/cases')
  async getGuildCases(req: Request, res: Response) {
    const data = await this.database.cases.getAll(req.params.id);
    const statusCode = data === undefined ? 404 : 200;
    const resp = statusCode === 404 ? {
      message: `Guild with ID "${req.params.id}" was not found.`
    } : data;

    return res.status(statusCode).json(resp);
  }

  @Get('/:id/logging')
  async getGuildLogging(req: Request, res: Response) {
    const data = await this.database.logging.get(req.params.id);
    const statusCode = data === undefined ? 404 : 200;
    const resp = statusCode === 404 ? {
      message: `Guild with ID "${req.params.id}" was not found.`
    } : data;

    return res.status(statusCode).json(resp);
  }

  @Put('/')
  whyDoWeExist(_: Request, res: Response) {
    // why are we still here, just to suffer?
    return res.status(204).end();
  }

  @Put('/:id')
  addNewGuild(_: Request, res: Response) {
    // Not Supported and never will
    return res.status(204).end();
  }

  @Put('/:id/automod')
  enableAutomod(_: Request, res: Response) {
    // requires `name` param
    return res.status(400).json({
      message: `Requires \`name\` parameter (i.e: /guilds/${_.params.id}/automod/spam)`
    });
  }

  @Put('/:id/automod/:name')
  enableSpecificAutomod(req: Request, res: Response) {
    // todo: this
  }
}
