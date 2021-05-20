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
const { Stopwatch, readdir } = require('@augu/utils');
const { readFile } = require('fs/promises');
const Util = require('./util');
const { resolve } = require('path');

// https://stackoverflow.com/a/56741853
const getNextObjectSize = (buffer) => (
  buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
);

// https://stackoverflow.com/a/56741853
const deserializeAsArray = (bson, buffer, opts) => {
  let _buffer = buffer;
  let results = [];

  while (_buffer.length > 0) {
    const nextSize = getNextObjectSize(buffer);
    console.log(nextSize);
    if (_buffer.length < nextSize)
      throw new TypeError('Corrupt BSON file: last object incomplete');
    else if (_buffer[nextSize - 1] !== 0)
      throw new Error('lol');

    const object = bson.deserialize(_buffer, {
      ...opts,
      allowObjectSmallerThanBufferSize: true,
      promoteBuffers: true
    });

    console.log(object);
    results.push(object);
    _buffer = _buffer.slice(nextSize);
  }

  return results;
};

/**
 * Module class for converting .bson documents into objects serialized as formatted
 * for PostgreSQL.
 */
module.exports = class BsonConverter {
  /**
   * The logger scoped to this [BsonConverter]
   */
  #logger;

  /**
   * The cached BSON module, returns `null` if this is first
   * initialized without calling [BsonConverter.convert]
   *
   * @type {import('bson') | null}
   */
  #bson;

  /**
   * Module class for converting .bson documents into objects serialized as formatted
   * for PostgreSQL.
   * 
   * @param {string} directory The directory
   */
  constructor(directory) {
    /**
     * The directory to find `.bson` files
     */
    this.directory = directory;
    this.#logger = new LoggerWithoutCallSite({
      displayFunctionName: true,
      exposeErrorCodeFrame: true,
      displayInstanceName: true,
      displayFilePath: 'hideNodeModulesOnly',
      dateTimePattern: '[ day-month-year / hour:minute:second ]',
      instanceName: 'converters: bson',
      name: 'scripts'
    });

    this.#bson = null;
  }

  /**
   * Lazily loads the BSON module and caches it
   */
  async _cacheBsonModule() {
    if (this.#bson !== null)
      return this.#bson;

    this.#bson = await import('bson');
    return this.#bson;
  }

  /**
   * Returns all the BSON files as an array
   */
  async _getBsonFiles() {
    this.#logger.debug(`Finding files in ${this.directory}...`);
    return readdir(this.directory);
  }

  async convert() {
    await this._cacheBsonModule();

    const files = await this._getBsonFiles();
    if (!files.length)
      throw new SyntaxError(`Directory ${this.directory} is empty or didn't match .bson or .metadata.json`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith('.bson')) {
        const metadata = files.find(f => f.endsWith('.metadata.json') && f === `${file.split('.').shift()}.metadata.json`);
        const data = JSON.parse(await readFile(metadata, 'utf-8'));

        await this._convertFrom(data, file);
      }
    }
  }

  /**
   * @param {Record<string, unknown>} data 
   * @param {string} file 
   */
  async _convertFrom(data, file) {
    console.log(file);
    switch (file) {
      case resolve(this.directory, 'guilds.bson'):
        return this._convertGuildShit(data, file);

      case 'users.bson':
        return this._convertUserShit(data, file);

      case 'cases.bson':
        return this._convertCasesShit(data, file);

      case 'warnings.bson':
        return this._convertWarningShit(data, file);
    }
  }

  /**
   * @param {Record<string, unknown>} data 
   * @param {string} file 
   */
  async _convertGuildShit(data, file) {
    const documents = deserializeAsArray(this.#bson, await readFile(file));
    console.log(documents);
  }

  /**
   * @param {Record<string, unknown>} data 
   * @param {string} file 
   */
  async _convertUserShit(data, file) {
    // todo: this
  }

  /**
   * @param {Record<string, unknown>} data 
   * @param {string} file 
   */
  async _convertCasesShit(data, file) {
    // todo: this
  }

  /**
   * @param {Record<string, unknown>} data 
   * @param {string} file 
   */
  async _convertWarningShit(data, file) {
    // todo: this
  }
};
