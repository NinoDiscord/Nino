/*
  Warnings:

  - You are about to drop the `Punishments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Punishments";

-- CreateTable
CREATE TABLE "punishments" (
    "warnings" INTEGER NOT NULL,
    "guild_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "extra" JSONB,
    "soft" BOOLEAN NOT NULL,
    "time" TEXT,
    "type" "PunishmentType" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "punishments.guild_id_unique" ON "punishments"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "punishments.index_unique" ON "punishments"("index");
