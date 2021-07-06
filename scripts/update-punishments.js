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

const { createConnection } = require('typeorm');
const { default: PunishmentsEntity } = require('../build/entities/PunishmentsEntity');

async function main() {
  console.log(`[scripts:update-punishments | ${new Date().toLocaleTimeString()}] Updating punishments...`);
  const connection = await createConnection();

  // Retrieve all punishments
  const repository = connection.getRepository(PunishmentsEntity);
  const punishments = await repository.find({});
  const traversedGuilds = [];
  let i = 0;

  await repository.delete({});

  // Update punishments
  console.log(`[scripts:update-punishments | ${new Date().toLocaleTimeString()}] Found ${punishments.length} punishments to update`);
  for (const punishment of punishments) {
    console.log(`idx: ${i} | guild entry: ${traversedGuilds.find(c => c.guild === punishment.guildID) !== undefined}`);

    if (traversedGuilds.find(c => c.guild === punishment.guildID) !== undefined) {
      const f = traversedGuilds.find(c => c.guild === punishment.guildID);
      const id = traversedGuilds.findIndex(c => c.guild === punishment.guildID);
      const entity = new PunishmentsEntity();

      entity.warnings = punishment.warnings;
      entity.guildID  = punishment.guildID;
      entity.index    = f.index += 1;
      entity.soft     = punishment.soft;
      entity.time     = punishment.time;
      entity.type     = punishment.type;
      entity.days     = punishment.days;

      traversedGuilds[id] = { guild: punishment.guildID, index: f.index += 1 };
      await repository.save(entity);
    } else {
      const entity = new PunishmentsEntity();
      entity.warnings = punishment.warnings;
      entity.guildID  = punishment.guildID;
      entity.index    = 1;
      entity.soft     = punishment.soft;
      entity.time     = punishment.time;
      entity.type     = punishment.type;
      entity.days     = punishment.days;

      traversedGuilds.push({ guild: punishment.guildID, index: 1 });
      await repository.save(entity);
    }
  }
}

main();
