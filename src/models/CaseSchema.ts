import { Document, model, Schema } from 'mongoose';

export interface CaseModel extends Document {
  id: number;
  guild: string;
  moderator: string;
  type: string;
  victim: string;
  reason: string;
  message?: string;
  soft?: boolean;
  time?: number;
}

const schema = new Schema<CaseModel>({
  id: {
    type: Number,
    index: true,
  },
  guild: {
    type: String,
    index: true,
  },
  moderator: String,
  type: String,
  victim: String,
  reason: String,
  message: {
    type: String,
    required: false,
    default: null,
  },
});

export default model<CaseModel>('cases', schema, 'cases');