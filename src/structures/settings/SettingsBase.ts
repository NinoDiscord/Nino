import { Model, Document, Query } from 'mongoose';

export interface SettingsBase<T extends Document> {
  model: Model<T, object>;
  get(id: string): Promise<T | null>;
  create(id: string): T;
  remove(id: string): void;
  update(
    id: string,
    doc: { [x: string]: any },
    cb: (error: any, raw: any) => void
  ): Query<any>;
}

// Why is this here?
// Because, I want the cases to be constructed
// at the command palor (src/commands)
// so we won't add `CaseSettingBase<T extends Document>#create` for simplistic sake
export interface CaseSettingBase<T extends Document> {
  model: Model<T, object>;
  get(guild: string, id: number): Promise<T | null>;
  getAll(guild: string): Promise<T[] | null>;
  create(
    guild: string,
    moderator: string,
    type: string,
    user: string,
    reason?: string
  ): Promise<T | null>;
  remove(guild: string, id: number): void;
  update(
    guild: string,
    id: number,
    doc: { [x: string]: any },
    cb: (error: any, raw: any) => void
  ): Query<any>;
}

// Why is this here?
// The warning base is different from everything
export interface WarningBase<T extends Document> {
  model: Model<T, object>;
  get(guildId: string, userId: string): Promise<T | null>;
  create(guildId: string, userId: string): T;
  remove(guildId: string, userId: string): void;
  update(
    guildId: string,
    userId: string,
    doc: { [x: string]: any }
  ): Promise<any>;
}
