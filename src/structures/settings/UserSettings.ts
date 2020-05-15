import model, { UserModel } from '../../models/UserSchema';
import { SettingsBase as Base } from './SettingsBase';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import Bot from '../Bot';

@injectable()
export default class UserSettings implements Base<UserModel> {
  public client: any;
  public model = model;

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.client = bot;
  }

  async get(id: string) {
    const document = await this.model.findOne({ guildID: id }).exec();
    if (!document || document === null) return null;
    return document;
  }

  async getOrCreate(id: string) {
    let settings = await this.get(id);
    if (!settings || settings === null)
      settings = this.client.settings.create(id);
    return settings!;
  }

  create(id: string) {
    const query = new this.model({
      userID: id,
      locale: 'en_US'
    });
    query.save();
    return query;
  }

  remove(id: string) {
    return this.model
      .findOne({ userID: id })
      .remove()
      .exec();
  }

  update(
    id: string,
    doc: { [x: string]: any },
    cb: (error: any, raw: any) => void
  ) {
    return this.model.updateOne({ userID: id }, doc, cb);
  }
}