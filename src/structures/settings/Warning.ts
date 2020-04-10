import model, { WarningModel } from '../../models/WarningSchema';
import { WarningBase as Base } from './SettingsBase';

export default class Warning implements Base<WarningModel> {
  public model = model;

  async get(guildId: string, userId: string) {
    const document = await this.model
      .findOne({ guild: guildId, user: userId })
      .exec();
    if (!document || document === null) return null;
    return document;
  }

  create(guildId: string, userId: string) {
    const query = new this.model({
      guild: guildId,
      user: userId,
      amount: 1,
    });
    query.save();
    return query;
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
