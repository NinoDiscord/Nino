import { CaseSettingBase as Base } from './SettingsBase';
import model, { CaseModel } from '../../../models/CaseSchema';
import { injectable } from 'inversify';

@injectable()
export default class CaseSettingsService implements Base<CaseModel> {
  public model = model;

  async get(guild: string, id: number) {
    const document = await this.model.findOne({ guild, id }).exec();
    if (!document) return null;
    return document;
  }

  async create(
    guild: string,
    moderator: string,
    type: string,
    user: string,
    reason?: string,
    soft?: boolean,
    time?: number
  ) {
    const newest = await this.model
      .find({ guild })
      .sort('-id')
      .exec();

    const query = new this.model({
      guild,
      moderator,
      type,
      victim: user,
      reason,
      id: newest[0] ? newest[0].id + 1 : 1,
      soft,
      time
    });

    await query.save();
    return query;
  }

  async getAll(guild: string) {
    return this.model.find({ guild });
  }

  remove(guild: string, id: number) {
    return this.model
      .findOne({ guild, id })
      .remove()
      .exec();
  }

  update(
    guild: string,
    id: number,
    doc: { [x: string]: any },
    cb: (error: any, raw: any) => void
  ) {
    return this.model.updateOne({ guild, id }, doc, cb);
  }
}
