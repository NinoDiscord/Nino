import { Schema, Document, model } from 'mongoose';

export interface CaseModel extends Document {
  id: number;
  guild: string;
  moderator: string;
  type: string;
  victim: string;
  reason: string;
  message: string;
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

const _model = model<CaseModel>('cases', schema, 'cases');
export default _model;
