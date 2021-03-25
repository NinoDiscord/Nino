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

const { LoggerWithoutCallSite } = require('tslog');
const { createConnection } = require('typeorm');
const { parse } = require('@augu/dotenv');
const { exec } = require('child_process');
const { join } = require('path');
const fs = require('fs/promises');

const logger = new LoggerWithoutCallSite({
  displayFunctionName: true,
  exposeErrorCodeFrame: true,
  displayInstanceName: true,
  displayFilePath: false,
  instanceName: 'script: v0 -> v1'
});

const getFlags = (content) => {
  const record = {};
  content.replaceAll(/(?:--?|—)([\w]+)(=| ?(\w+|['"].*['"]))?/gi, (_, key, value) => {
    record[key.trim()] = value ? value.replaceAll(/(^[='"]+|['"]+$)/g, '').trim() : true;
    return value;
  });

  return record;
};

const execAsync = (command, options) => new Promise((resolve, reject) => {
  const child = exec(command, options);

  child.stdout.on('data', (chunk) => logger.debug(`stdout (${command}):`, chunk));
  child.stderr.on('data', (chunk) => logger.debug(`stderr (${command}):`, chunk));
  child.on('exit', (code, signal) => {
    const success = code === 0;
    logger.info(`${command}: Command has exited with code ${code}${signal ? `, with signal '${signal}'` : ''}`);

    return success ? resolve() : reject(new Error('Read logs with `stderr` prefixed.'));
  });
});

(async() => {
  logger.info('Welcome to the database conversion script!');
  logger.info('This script takes care of converting the Mongo database to the PostgreSQL one!');
  logger.info('You can use the `--dir` (or `-d`) flag to load from a directory');

  const args = process.argv.slice(2);
  const flags = getFlags(args.join(' '));
  const directory = flags['dir'] || flags['d'];

  if (!directory) {
    logger.warn('Assuming we should load in from Mongo itself...');
    const config = parse({
      delimiter: ',',
      populate: false,
      file: join(__dirname, '..', '.env')
    });

    try {
      await import('mongodb');
    } catch(ex) {
      logger.info('Assuming you ran this script once, now installing...');

      await installMongo();
      logger.info('This script will exit, please re-run it using `npm run migrate`!');
      process.exit(0);
    }

    logger.info('Assuming you reloaded the script, now converting...');
    const { default: mongodb } = await import('mongodb');
    const client = new mongodb.MongoClient(config.MONGO_URI, {
      appname: 'Nino: v0 -> v1',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    try {
      await client.connect();
      logger.info('Connected to MongoDB!');
    } catch(ex) {
      logger.error('Unable to connect to Mongo:', ex);
      process.exit(1);
    }

    const db = client.db(config.MONGO_DB);
    const guilds = db.collection('guilds');
    const cases = db.collection('cases');
    const users = db.collection('users');
    const warnings = db.collection('warnings');

    logger.info('Now connecting to PostgreSQL...');
    const connection = await createConnection();

    logger.info('Connected to PostgreSQL!');

    await connection.close();
    await client.close();

    process.exit(0);
  }
})();

const installMongo = async () => {
  try {
    await execAsync('npm i mongodb');
  } catch(ex) {
    logger.error(ex);
    process.exit(1);
  }
};
