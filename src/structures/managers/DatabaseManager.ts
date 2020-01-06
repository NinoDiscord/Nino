import { injectable, inject } from 'inversify';
import { Config } from '../Bot';
import { TYPES } from '../../types';
import { Admin } from 'mongodb';
import mongoose from 'mongoose';
import Logger from '../Logger';
import 'reflect-metadata';

interface BuildInfo {
  version: string;
  gitVersion: string;
  modules: any[];
  allocator: string;
  javascriptEngine: string;
  sysInfo: 'deprecated';
  versionArray: number[];
  debug: false;
  maxBsonObjectSize: number;
  storageEngines: string[];
  ok: number;
  openssl: { running: string; compiled: string };
  buildEnvironment: {
    distmod: string;
    distarch: string;
    cc: string;
    ccflags: string;
    cxx: string;
    linkflags: string;
    target_arch: string;
    target_os: string;
  };
}

@injectable()
export default class DatabaseManager {
  public admin!: Admin;
  public build!: BuildInfo;
  public logger: Logger = new Logger();
  public uri: string;
  public m!: typeof mongoose;

  constructor(
    @inject(TYPES.Config) config: Config
  ) {
    this.uri = config.databaseUrl;
  }

  async connect() {
    this.m = await mongoose.connect(this.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
    });

    this.m.connection.on('error', error => error ? this.logger.error(error) : null);
    this.m.connection.once('open', () =>
      this.logger.database(`Opened a connection to MongoDB with URI: ${this.uri}`)
    );
  }

  async getBuild() {
    if (!this.admin) this.admin = this.m.connection.db.admin();
    if (!this.build) this.build = await this.admin.buildInfo();
    return this.build;
  }
}
