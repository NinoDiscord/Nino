import model, { WarningModel } from '../../models/WarningSchema';
import { WarningBase as Base } from './SettingsBase';

export default class Warning implements Base<WarningModel> {
    public client: any;
    public model = model;

    constructor(client: any) {
        this.client = client;
    }

    async get(guildId: string, userId: string) {
        const document = await this.model.findOne({ guildID: guildId, userID: userId}).exec();
        if (!document || document === null) return null;
        return document;
    }

    create(guildId: string, userId: string) {
        const query = new this.model({
            guildID: guildId,
            userId: userId,
            amount: 0
        });
        query.save();
        return query;
    }

    remove(guildId: string, userId: string) {
        return this.model.findOne({ guildID: guildId, userID: userId }).remove().exec();
    }

    update(guildId: string, userId: string, doc: { [x: string]: any }, cb: (error: any, raw: any) => void) {
        return this.model.updateOne({ guildID: guildId, userID: userId }, doc, cb);
    }
}