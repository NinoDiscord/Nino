import { Schema, Document, model } from 'mongoose';

export interface UserModel extends Document {
  userID: string;
  locale: string;
}

const schema = new Schema<UserModel>({
  guildID: {
    type: String,
    unique: true,
  },
  locale: {
    type: String,
    default: 'en_US'
  }
});

const _model = model<UserModel>('users', schema, 'users');
export default _model;