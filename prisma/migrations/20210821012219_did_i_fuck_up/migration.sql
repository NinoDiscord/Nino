/*
  Warnings:

  - You are about to drop the `warnings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[guild_id,index]` on the table `punishments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "punishments.guild_id_unique";

-- DropIndex
DROP INDEX "punishments.index_unique";

-- DropTable
DROP TABLE "warnings";

-- CreateTable
CREATE TABLE "Warning" (
    "guild_id" TEXT NOT NULL,
    "reason" TEXT,
    "amount" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Warning.guild_id_user_id_unique" ON "Warning"("guild_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "punishments.guild_id_index_unique" ON "punishments"("guild_id", "index");
