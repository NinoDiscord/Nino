import { Schema, Document, model } from 'mongoose';

export interface CaseModel extends Document {
    id: number;
    guild: string;
    moderator: string;
    victim: string;
    reason: string;
}

const schema = new Schema<CaseModel>({
    id: Number,
    guild: String,
    moderator: String,
    victim: String,
    reason: String
});

const _model = model<CaseModel>('cases', schema, 'cases');
export default _model;