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

const { default: PunishmentsEntity } = require('../../build/entities/PunishmentsEntity');
const { default: AutomodEntity } = require('../../build/entities/AutomodEntity');
const { default: CaseEntity } = require('../../build/entities/CaseEntity');
const { default: GuildEntity } = require('../../build/entities/GuildEntity');
const { default: WarningsEntity } = require('../../build/entities/WarningsEntity');
const { default: LoggingEntity } = require('../../build/entities/LoggingEntity');
const { default: UserEntity } = require('../../build/entities/UserEntity');

/**
 * Returns the repositories from the responding `connection`.
 * @param {import('typeorm').Connection} connection The connection established
 */
module.exports = (connection) => ({
  punishments: connection.getRepository(PunishmentsEntity),
  warnings: connection.getRepository(WarningsEntity),
  logging: connection.getRepository(LoggingEntity),
  automod: connection.getRepository(AutomodEntity),
  guilds: connection.getRepository(GuildEntity),
  cases: connection.getRepository(CaseEntity),
  users: connection.getRepository(UserEntity)
});
