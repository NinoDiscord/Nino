import { Model, Document, Query } from 'mongoose';

export default interface SettingsBase<T extends Document> {
    model: Model<T, {}>;
    get(id: string): T | null;
    create(id: string): T;
    remove(id: string): void;
    update(id: string, doc: { [x: string]: any; }, cb: (error: any, raw: any) => void): Query<any>;
}