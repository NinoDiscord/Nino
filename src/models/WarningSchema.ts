import { Schema, Document, model } from 'mongoose';

export interface WarningModel extends Document {
  guild: string;
  user: string;
  amount: number;
  reason?: string;
}

const schema = new Schema<WarningModel>({
  guild: {
    type: String,
    index: true,
  },
  user: {
    type: String,
    index: true,
  },
  amount: {
    type: Number,
    default: 1,
    max: 10
  },
  reason: {
    type: String,
    default: undefined
  }
});

export default model<WarningModel>('warnings', schema, 'warnings');