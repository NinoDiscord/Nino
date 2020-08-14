import model, { WarningModel } from '../../models/WarningSchema';
import { WarningBase as Base } from './settings/SettingsBase';
import { injectable } from 'inversify';

@injectable()
export default class WarningService implements Base<WarningModel> {
  public model = model;

  async get(guildId: string, userId: string) {
    const document = await this.model
      .findOne({ guild: guildId, user: userId })
      .exec();
    if (!document) return null;
    return document;
  }

  async create(guildId: string, userId: string) {
    const query = new this.model({
      guild: guildId,
      user: userId,
      amount: 0,
    });
    await query.save();
    return query;
  }

  async getOrCreate(guildId: string, userId: string) {
    const warnings = await this.get(guildId, userId);
    if (!warnings) {
      return this.create(guildId, userId);
    }
    return warnings;
  }

  remove(guildId: string, userId: string) {
    return this.model
      .findOne({ guild: guildId, user: userId })
      .remove()
      .exec();
  }

  async update(guildId: string, userId: string, doc: { [x: string]: any }) {
    return this.model.updateOne(
      { guild: guildId, user: userId },
      doc,
      (error, raw) => {
        if (error) console.log(error);
      }
    );
  }
}
