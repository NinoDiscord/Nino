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

package sh.nino.modules.punishments.extensions

import dev.kord.common.entity.Permission
import dev.kord.common.entity.Permissions
import sh.nino.database.PunishmentType

/**
 * Returns this [PunishmentType] as an emoji.
 */
val PunishmentType.asEmoji: String
    get() = when (this) {
        PunishmentType.BAN -> "\uD83D\uDD28"
        PunishmentType.KICK -> "\uD83D\uDC62"
        PunishmentType.MUTE -> "\uD83D\uDD07"
        PunishmentType.UNBAN -> "\uD83D\uDC64"
        PunishmentType.UNMUTE -> "\uD83D\uDCE2"
        PunishmentType.VOICE_MUTE -> "\uD83D\uDD07"
        PunishmentType.VOICE_UNMUTE -> "\uD83D\uDCE2"
        PunishmentType.VOICE_DEAFEN -> "\uD83D\uDD07"
        PunishmentType.VOICE_UNDEAFEN -> "\uD83D\uDCE2"
        PunishmentType.THREAD_MESSAGES_ADDED -> "\uD83E\uDDF5"
        PunishmentType.THREAD_MESSAGES_REMOVED -> "\uD83E\uDDF5"
        PunishmentType.ROLE_ADD -> ""
        PunishmentType.ROLE_REMOVE -> ""
        else -> error("Unknown punishment type: $this")
    }

/**
 * Returns the required [Permissions] for this [PunishmentType].
 */
val PunishmentType.permissions: Permissions
    get() = when (this) {
        PunishmentType.MUTE, PunishmentType.UNMUTE, PunishmentType.ROLE_ADD, PunishmentType.ROLE_REMOVE -> Permissions {
            +Permission.ManageRoles
        }

        PunishmentType.VOICE_UNDEAFEN, PunishmentType.VOICE_DEAFEN -> Permissions {
            +Permission.DeafenMembers
        }

        PunishmentType.VOICE_MUTE, PunishmentType.VOICE_UNMUTE -> Permissions {
            +Permission.MuteMembers
        }

        PunishmentType.UNBAN, PunishmentType.BAN -> Permissions {
            +Permission.BanMembers
        }

        PunishmentType.KICK -> Permissions {
            +Permission.KickMembers
        }

        PunishmentType.THREAD_MESSAGES_ADDED, PunishmentType.THREAD_MESSAGES_REMOVED -> Permissions {
            +Permission.ManageThreads
        }

        else -> Permissions()
    }

fun PunishmentType.toKey(): String = when (this) {
    PunishmentType.BAN -> "ban"
    PunishmentType.KICK -> "kick"
    PunishmentType.MUTE -> "mute"
    PunishmentType.UNBAN -> "unban"
    PunishmentType.UNMUTE -> "unmute"
    PunishmentType.VOICE_MUTE -> "voice mute"
    PunishmentType.VOICE_UNMUTE -> "voice unmute"
    PunishmentType.VOICE_DEAFEN -> "voice deafen"
    PunishmentType.VOICE_UNDEAFEN -> "voice undeafen"
    PunishmentType.THREAD_MESSAGES_ADDED -> "thread messages added"
    PunishmentType.THREAD_MESSAGES_REMOVED -> "thread messages removed"
    else -> error("Unknown punishment type: $this")
}

fun String.toPunishmentType(): PunishmentType = when (this) {
    "ban" -> PunishmentType.BAN
    "kick" -> PunishmentType.KICK
    "mute" -> PunishmentType.MUTE
    "unban" -> PunishmentType.UNBAN
    "unmute" -> PunishmentType.UNMUTE
    "voice mute" -> PunishmentType.VOICE_MUTE
    "voice unmute" -> PunishmentType.VOICE_UNMUTE
    "voice deafen" -> PunishmentType.VOICE_DEAFEN
    "voice undeafen" -> PunishmentType.VOICE_UNDEAFEN
    "thread messages added" -> PunishmentType.THREAD_MESSAGES_ADDED
    "thread messages removed" -> PunishmentType.THREAD_MESSAGES_REMOVED
    else -> error("Unknown punishment type: $this")
}
