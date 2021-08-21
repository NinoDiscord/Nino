/*
  Warnings:

  - You are about to drop the `Warning` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Warning";

-- CreateTable
CREATE TABLE "warnings" (
    "guild_id" TEXT NOT NULL,
    "reason" TEXT,
    "amount" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "warnings.guild_id_unique" ON "warnings"("guild_id");
