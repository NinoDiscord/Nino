import { Schema, Document, model } from 'mongoose';

export interface WarningModel extends Document {
    guild: string;
    user: string;
    amount: number;
}

const schema = new Schema<WarningModel>({
    guild: {
        type: String,
        index: true
    },
    user: {
        type: String,
        index: true
    },
    amount: {
        type: Number,
        default: 1,
        max: 5
    } 
});

const _model = model<WarningModel>('warnings', schema, 'warnings');
export default _model;