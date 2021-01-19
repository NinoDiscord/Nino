import { injectable, inject } from 'inversify';
import { Config } from '../Bot';
import { TYPES } from '../../types';
import { Admin } from 'mongodb';
import mongoose from 'mongoose';
import Logger from '../Logger';
import 'reflect-metadata';

@injectable()
export default class DatabaseManager {
  public auth?: { username: string; password: string; source: string; };
  public admin!: Admin;
  public logger: Logger = new Logger();
  public uri: string;
  public m!: typeof mongoose;

  constructor(
    @inject(TYPES.Config) config: Config
  ) {
    this.uri = config.databaseUrl;
    this.auth = config.dbAuth;
  }

  async connect() {
    this.m = await mongoose.connect(this.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      authSource: this.auth ? this.auth.source : undefined,
      auth: this.auth ? {
        user: this.auth.username,
        password: this.auth.password
      } : undefined
    });

    this.m.connection.on('error', error => error ? this.logger.error(error) : null);
    this.logger.database(`Opened a connection to MongoDB with URI: ${this.uri}`);

    this.admin = this.m.connection.db.admin();
  }

  dispose() {
    this.m.connection.close();
    this.logger.warn('Database connection was disposed');
  }
}
