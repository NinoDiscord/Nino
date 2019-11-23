import model, { GuildModel } from '../../models/GuildSchema';
import { SettingsBase as Base } from './SettingsBase';
import Warning from './Warning';

export default class GuildSettings implements Base<GuildModel> {
    public client: any;
    public model = model;

    constructor(client: any) {
        this.client = client;
    }

    async get(id: string) {
        const document = await this.model.findOne({ guildID: id }).exec();
        if (!document || document === null) return null;
        return document;
    }

    create(id: string) {
        const query = new this.model({
            guildID: id,
            prefix: this.client.config.discord.prefix
        });
        query.save();
        return query;
    }

    remove(id: string) {
        return this.model.findOne({ guildID: id }).remove().exec();
    }

    update(id: string, doc: { [x: string]: any }, cb: (error: any, raw: any) => void) {
        const search = { guildID: id };
        if (!!doc.$push) search['punishments'] = { $not: { $size: 15 }};
        return this.model.updateOne(search, doc, cb);
    }
}