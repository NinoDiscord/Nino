import { Admin } from 'mongodb';
import mongoose from 'mongoose';

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
    openssl: { running: string; compiled: string; }
    buildEnvironment: {
        distmod: string;
        distarch: string;
        cc: string;
        ccflags: string;
        cxx: string;
        linkflags: string;
        target_arch: string;
        target_os: string;
    }
}
export default class DatabaseManager {
    public uri: string = 'mongodb://localhost:27017/nino';
    public admin!: Admin;
    public build!: BuildInfo;
    public m!: typeof mongoose;

    constructor(uri: string = 'mongodb://localhost:27017/nino') {
        this.uri = uri;
    }

    async connect() {
        this.m = await mongoose.connect(this.uri, { useNewUrlParser: true });
        this.m.connection.on('error', (error) => {
            if (error) console.error(error);
        });
    }

    getBuild() {
        if (!this.admin) this.admin = this.m.connection.db.admin();
        if (!this.build) {
            this.admin.buildInfo((error, build) => {
                if (error) console.error(error);
                this.build = build;
            });
        }

        return this.build;
    }
}