import { CaseSettingBase as Base } from './SettingsBase';
import model, { CaseModel } from '../../models/CaseSchema';

export default class CaseSettings implements Base<CaseModel> {
    public model = model;

    async get(id: string) {
        const document = await this.model.findOne({ guild: id }).exec();
        if (!document || document === null) return null;
        return document;
    }

    remove(id: string) {
        return this.model.findOne({ guild: id }).remove().exec();
    }

    update(id: string, doc: { [x: string]: any }, cb: (error: any, raw: any) => void) {
        return this.model.updateOne({ guild: id }, doc, cb);
    }
}