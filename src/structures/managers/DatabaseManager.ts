const mongoose = require('mongoose');
const { colors } = require('pikmin');

export default class Database {
  uri: String;
  admin: any;
  build: any;
  mongoose: any;
  connection: any;

  constructor(uri: String = 'mongodb://127.0.0.1:27017/nino') {
    this.uri = uri;
    this.admin = undefined;
    this.build = undefined;
    this.mongoose = mongoose;
    this.connection = undefined;

    return this;
  }

  connect(options: Object = { useNewUrlParser: true }) {
    try { this.connection = mongoose.connect(this.uri, options); }
    catch (ex) { throw new Error(ex); }

    this.mongoose.connection.on('error', (err) => {if (!!err) console.error(err) });

    return this;
  }

  async find(collection: String, filter: any) {
    let result = {};
    try { result = await this.mongoose.connection.collection(collection).findOne(filter); }
    catch (ex) { throw new Error(ex); }

    return result;
  }

  async findMany(collection: String, filter: any, options: any = {}) {
    let cursor, result;

    try {
      cursor = await this.mongoose.connection.collection(collection)
        .find(filter)
        .sort(options.sort || {})
        .skip(options.skip || 0)
        .limit(options.limit || 0);
      result = await cursor.toArray();

      cursor.close();
      return result;
    }
    catch (ex) { throw new Error(ex); }
  }

  async create(collection: String, document: any, options: any = {}) {
    let result = {};

    try { result = await this.mongoose.connection.collection(collection).insertOne(document, options); }
    catch (ex) { throw new Error(ex); }

    return result;
  }

  async update(collection: String, filter: any, update: any) {
    let result = {};

    try { result = await this.mongoose.connection.collection(collection).findOneAndUpdate(filter, { $set: update }); }
    catch(ex) { throw new Error(ex); }

    return result;
  }

  async delete(collection: any, filter: any) {
    let result = {};

    try { result = await this.mongoose.connection.collection(collection).deleteOne(filter); }
    catch(ex) { throw new Error(ex); }

    return result;
  }

  getBuild() {
    if (!this.admin) this.admin = new mongoose.mongo.Admin(mongoose.connection.db);
    if (!this.build) {
      this.admin.buildInfo((err, build) => {
        if (err) throw new Error(err);
        this.build = build;
      });
    }

    return this.build;
  }

  get() { return this.mongoose; }
};