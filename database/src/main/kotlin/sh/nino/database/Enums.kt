/*
 * 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
 * Copyright (c) 2019-2022 Nino Team
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

package sh.nino.database

enum class GlobalBanType {
    GUILD,
    USER;
}

enum class PunishmentType {
    THREAD_MESSAGES_REMOVED,
    THREAD_MESSAGES_ADDED,
    WARNING_REMOVED,
    VOICE_UNDEAFEN,
    WARNING_ADDED,
    VOICE_DEAFEN,
    VOICE_UNMUTE,
    VOICE_MUTE,
    ROLE_REMOVE,
    ROLE_ADD,
    UNMUTE,
    UNBAN,
    MUTE,
    KICK,
    BAN;
}

enum class LogEvent {
    VOICE_MEMBER_DEAFEN,
    VOICE_CHANNEL_SWITCH,
    VOICE_CHANNEL_LEAVE,
    VOICE_CHANNEL_JOIN,
    VOICE_MEMBER_MUTED,
    MESSAGE_UPDATED,
    MESSAGE_DELETED,
    MEMBER_UNBOOSTED,
    MEMBER_BOOSTED,
    THREAD_ARCHIVED,
    THREAD_CREATED,
    THREAD_DELETED;
}
