/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { exec } = require('child_process');
const typeorm = require('typeorm');

const { default: PunishmentsEntity } = require('../../build/entities/PunishmentsEntity');
const { default: AutomodEntity } = require('../../build/entities/AutomodEntity');
const { default: CaseEntity } = require('../../build/entities/CaseEntity');
const { default: GuildEntity } = require('../../build/entities/GuildEntity');
const { default: WarningsEntity } = require('../../build/entities/WarningsEntity');
const { default: LoggingEntity } = require('../../build/entities/LoggingEntity');
const { default: UserEntity } = require('../../build/entities/UserEntity');

module.exports = class Util {
  /**
   * @returns {[import('mongodb').MongoClient, import('typeorm').Connection]}
   */
  static async getConnections() {
    const { default: mongodb } = await import('mongodb');
    const client = new mongodb.MongoClient(config.MONGO_URI, {
      appname: 'Nino: v0 -> v1',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  
    await client.connect();
    const postgres = await this.createPostgresConnection();
  
    return [client, postgres];
  }

  static createPostgresConnection() {
    return typeorm.createConnection();
  }

  /**
   * @param {typeorm.Connection} connection 
   * @returns {RepositoryCenter}
   */
  static getRepositories(connection) {
    return {
      punishments: connection.getRepository(PunishmentsEntity),
      warnings: connection.getRepository(WarningsEntity),
      logging: connection.getRepository(LoggingEntity),
      automod: connection.getRepository(AutomodEntity),
      guilds: connection.getRepository(GuildEntity),
      cases: connection.getRepository(CaseEntity),
      users: connection.getRepository(UserEntity)
    };
  }

  static execAsync(command, options, callback) {
    const child = exec(command, options);

    return new Promise((resolve, reject) => {
      child.stdout.on('data', (chunk) => callback(false, chunk));
      child.stderr.on('data', (chunk) => callback(true, chunk));
      child.on('exit', (code) => code === 0 ? resolve() : reject(new Error('Read logs with `stderr` prefixed.')));
    });
  }
};

/**
 * @typedef {object} RepositoryCenter
 * @prop {typeorm.Repository<import('../../src/entities/PunishmentsEntity').default>} punishments
 * @prop {typeorm.Repository<import('../../src/entities/WarningsEntity').default>} warnings
 * @prop {typeorm.Repository<import('../../src/entities/LoggingEntity').default>} logging
 * @prop {typeorm.Repository<import('../../src/entities/AutomodEntity').default>} automod
 * @prop {typeorm.Repository<import('../../src/entities/GuildEntity').default>} guilds
 * @prop {typeorm.Repository<import('../../src/entities/CaseEntity').default>} cases
 * @prop {typeorm.Repository<import('../../src/entities/UserEntity').default>} users
 */
