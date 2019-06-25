import { Model, Document, Query } from 'mongoose';

export interface SettingsBase<T extends Document> {
    model: Model<T, {}>;
    get(id: string): Promise<T | null>;
    create(id: string): T;
    remove(id: string): void;
    update(id: string, doc: { [x: string]: any; }, cb: (error: any, raw: any) => void): Query<any>;
}

// Why is this here?
// Because, I want the cases to be constructed
// at the command palor (src/commands)
// so we won't add `CaseSettingBase<T extends Document>#create` for simplistic sake
export interface CaseSettingBase<T extends Document> {
    model: Model<T, {}>;
    get(id: string): Promise<T | null>;
    remove(id: string): void;
    update(id: string, doc: { [x: string]: any; }, cb: (error: any, raw: any) => void): Query<any>;
}