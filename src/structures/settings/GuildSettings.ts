import model, { GuildModel } from '../../models/GuildSchema';
import { SettingsBase as Base } from './SettingsBase';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Bot from '../Bot';

@injectable()
export default class GuildSettings implements Base<GuildModel> {
  public client: Bot;
  public model = model;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.client = bot;
  }

  async get(id: string) {
    const document = await this.model.findOne({ guildID: id }).exec();
    if (!document || document === null) return null;
    return document;
  }

  async getOrCreate(id: string): Promise<GuildModel> {
    let settings = await this.get(id);
    if (!settings || settings === null)
      settings = await this.create(id);
    return settings!;
  }

  async create(id: string): Promise<GuildModel> {
    const query = new this.model({
      guildID: id,
      prefix: this.client.config.discord.prefix,
    });
    await query.save();
    return query;
  }

  remove(id: string) {
    return this.model
      .findOne({ guildID: id })
      .remove()
      .exec();
  }

  update(
    id: string,
    doc: { [x: string]: any },
    cb: (error: any, raw: any) => void
  ) {
    const search = { guildID: id };
    // eslint-disable-next-line
    if (!!doc.$push) search['punishments'] = { $not: { $size: 15 }};
    return this.model.updateOne(search, doc, cb);
  }
}
