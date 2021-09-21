-- AlterTable
ALTER TABLE "automod" ADD COLUMN     "messageLinks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "omit_channels" TEXT[],
ADD COLUMN     "omit_users" TEXT[];

-- CreateTable
CREATE TABLE "guild_customizibility" (
    "webhook" TEXT,
    "logging" JSONB NOT NULL,
    "modlog" JSONB NOT NULL,
    "guild_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_customizibility_guild_id_key" ON "guild_customizibility"("guild_id");

-- RenameIndex
ALTER INDEX "automod.guild_id_unique" RENAME TO "automod_guild_id_key";

-- RenameIndex
ALTER INDEX "cases.guildId_unique" RENAME TO "cases_guildId_key";

-- RenameIndex
ALTER INDEX "global_bans.id_unique" RENAME TO "global_bans_id_key";

-- RenameIndex
ALTER INDEX "guilds.guild_id_unique" RENAME TO "guilds_guild_id_key";

-- RenameIndex
ALTER INDEX "logging.guild_id_unique" RENAME TO "logging_guild_id_key";

-- RenameIndex
ALTER INDEX "punishments.guild_id_index_unique" RENAME TO "punishments_guild_id_index_key";

-- RenameIndex
ALTER INDEX "users.user_id_unique" RENAME TO "users_user_id_key";

-- RenameIndex
ALTER INDEX "warnings.guild_id_user_id_unique" RENAME TO "warnings_guild_id_user_id_key";
