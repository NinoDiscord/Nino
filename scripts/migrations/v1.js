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

require('../../build/util/patches/RequirePatch');

const {
  promises: { readFile },
  existsSync,
} = require('fs');

const { PrismaClient } = require('.prisma/client');
const { withIndex } = require('~/build/util');
const { join } = require('path');

const prisma = new PrismaClient();

const main = async () => {
  console.log('migrations: v1: migrating...');

  const MIGRATION_DATA_PATH = join(process.cwd(), '.nino', 'migration.json');
  if (!existsSync(MIGRATION_DATA_PATH)) {
    console.warn('migrations: v1: run `yarn export:v1:db` before migrating...');
    await prisma.$disconnect();

    process.exit(1);
  }

  const contents = await readFile(MIGRATION_DATA_PATH, 'utf-8');
  const data = JSON.parse(contents);

  console.log(
    `migrations: v1: running v1 -> v2 migrations that was executed at ${new Date(
      Date.now() - data.ran_at
    ).toString()} by ${data.blame}`
  );

  console.log(`migrations: v1: bulk insert ${data.data.automod.length} automod objects.`);
  for (const [index, automod] of withIndex(data.data.automod)) {
    console.log(`#${index}:`, automod);

    await prisma.automod.create({
      data: {
        blacklistedWords: automod.blacklisted_words,
        shortlinks: automod.shortlinks,
        blacklist: automod.blacklist,
        mentions: automod.mentions,
        invites: automod.invites,
        dehoisting: automod.dehoisting,
        guildId: automod.guild_id,
        spam: automod.spam,
        raid: automod.raid,
      },
    });
  }

  console.log('we are now done here!');
  await prisma.$disconnect();

  process.exit(0);
};

main();
