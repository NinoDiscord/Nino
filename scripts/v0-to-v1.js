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
const fs = require('fs/promises');

const logger = new LoggerWithoutCallSite({
  displayFunctionName: true,
  exposeErrorCodeFrame: true,
  displayInstanceName: true,
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

(async() => {
  logger.info('Welcome to the database conversion script!');
  logger.info('This script takes care of converting the Mongo database to the PostgreSQL one!');
  logger.info('You can use the `--dir` (or `-d`) flag to load from a directory');

  const args = process.argv.slice(2);
  const flags = getFlags(args.join(' '));
  const directory = flags['dir'] || flags['d'];

  if (directory !== undefined && typeof directory === 'boolean') {
    logger.fatal('`--dir` / `-d` flag must be specified.');
    process.exit(1);
  } else if (directory !== undefined) {
    await loadInBsonDatabase(directory);
  } else {
    await loadInFromMongo();
  }
})();

const loadInBsonDatabase = async (directory) => {
  /** @type {import('fs').Stats} */
  let stats;
  try {
    await fs.lstat(directory);
  } catch(ex) {
    logger.fatal('Unable to get statistics of the directory specified, is it an absolute path?');
    process.exit(1);
  }

  if (!stats.isDirectory()) {
    logger.fatal('Specified "directory" was not a directory.');
    process.exit(1);
  }
};

const loadInFromMongo = async() => {
  // todo: this uwu
};
