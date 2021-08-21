-- CreateEnum
CREATE TYPE "LogEvent" AS ENUM ('VOICE_MEMBER_DEAFENED', 'VOICE_CHANNEL_LEAVE', 'VOICE_CHANNEL_SWITCH', 'VOICE_CHANNEL_JOIN', 'VOICE_MEMBER_MUTED', 'MESSAGE_UPDATED', 'MESSAGE_DELETED', 'MEMBER_BOOSTED', 'THREAD_CREATED', 'THREAD_DELETED');

-- CreateEnum
CREATE TYPE "GlobalBanType" AS ENUM ('GUILD', 'USER');

-- CreateEnum
CREATE TYPE "PunishmentType" AS ENUM ('ALLOW_THREADS_AGAIN', 'WARNING_REMOVED', 'VOICE_UNDEAFEN', 'WARNING_ADDED', 'VOICE_UNMUTE', 'VOICE_DEAFEN', 'VOICE_MUTE', 'NO_THREADS', 'UNMUTE', 'UNBAN', 'KICK', 'MUTE', 'BAN');

-- CreateTable
CREATE TABLE "automod" (
    "blacklisted_words" TEXT[],
    "dehoisting" BOOLEAN NOT NULL DEFAULT false,
    "shortlinks" BOOLEAN NOT NULL DEFAULT false,
    "blacklist" BOOLEAN NOT NULL DEFAULT false,
    "mentions" BOOLEAN NOT NULL DEFAULT false,
    "guild_id" TEXT NOT NULL,
    "invites" BOOLEAN NOT NULL DEFAULT false,
    "spam" BOOLEAN NOT NULL DEFAULT false,
    "raid" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "global_bans" (
    "reason" TEXT,
    "issuer" TEXT NOT NULL,
    "type" "GlobalBanType" NOT NULL,
    "id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "cases" (
    "attachments" TEXT[],
    "moderator_id" TEXT NOT NULL,
    "message_id" TEXT,
    "victim_id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "reason" TEXT,
    "index" INTEGER NOT NULL,
    "type" "PunishmentType" NOT NULL,
    "soft" BOOLEAN NOT NULL,
    "time" INTEGER
);

-- CreateTable
CREATE TABLE "guilds" (
    "modlog_channel_id" TEXT,
    "muted_role_id" TEXT,
    "prefixes" TEXT[],
    "language" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "logging" (
    "ignored_channels" TEXT[],
    "ignored_users" TEXT[],
    "channel_id" TEXT,
    "enabled" BOOLEAN NOT NULL,
    "events" "LogEvent"[],
    "guild_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Punishments" (
    "warnings" INTEGER NOT NULL,
    "guild_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "extra" JSONB,
    "soft" BOOLEAN NOT NULL,
    "time" TEXT,
    "type" "PunishmentType" NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "prefixes" TEXT[],
    "language" TEXT NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Warning" (
    "guild_id" TEXT NOT NULL,
    "reason" TEXT,
    "amount" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "automod.guild_id_unique" ON "automod"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "global_bans.id_unique" ON "global_bans"("id");

-- CreateIndex
CREATE UNIQUE INDEX "cases.guildId_unique" ON "cases"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "guilds.guild_id_unique" ON "guilds"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "logging.guild_id_unique" ON "logging"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "Punishments.guild_id_unique" ON "Punishments"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "Punishments.index_unique" ON "Punishments"("index");

-- CreateIndex
CREATE UNIQUE INDEX "users.user_id_unique" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Warning.guild_id_unique" ON "Warning"("guild_id");
