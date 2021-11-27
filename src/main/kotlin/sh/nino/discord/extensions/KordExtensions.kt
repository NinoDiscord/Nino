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

package sh.nino.discord.extensions

import dev.kord.common.entity.Permission
import dev.kord.common.entity.Snowflake
import java.awt.Color
import dev.kord.common.Color as KordColor

/**
 * Converts a [java.awt.Color] into a [KordColor] object.
 */
fun Color.asKordColor(): KordColor = KordColor(red, green, blue)
fun Long.asSnowflake(): Snowflake = Snowflake(this)
fun ULong.asSnowflake(): Snowflake = this.toLong().asSnowflake()

fun Permission.asString(): String = when (this) {
    is Permission.CreateInstantInvite -> "Create Instant Invite"
    is Permission.KickMembers -> "Kick Members"
    is Permission.BanMembers -> "Ban Members"
    is Permission.Administrator -> "Administrator"
    is Permission.ManageChannels -> "Manage Channels"
    is Permission.AddReactions -> "Add Reactions"
    is Permission.ViewAuditLog -> "View Audit Log"
    is Permission.Stream -> "Stream in Voice Channels"
    is Permission.ViewChannel -> "Read Messages in Guild Channels"
    is Permission.SendMessages -> "Send Messages in Guild Channels"
    is Permission.SendTTSMessages -> "Send Text-to-Speech Messages in Guild Channels"
    is Permission.EmbedLinks -> "Embed Links"
    is Permission.AttachFiles -> "Attach Files to Messages"
    is Permission.ReadMessageHistory -> "Read Message History in Guild Channels"
    is Permission.MentionEveryone -> "Mention Everyone"
    is Permission.UseExternalEmojis -> "Use External Emojis in Messages"
    is Permission.ViewGuildInsights -> "View Guild Insights"
    is Permission.Connect -> "Connect in Voice Channels"
    is Permission.Speak -> "Speak in Voice Channels"
    is Permission.MuteMembers -> "Mute Members in Voice Channels"
    is Permission.DeafenMembers -> "Deafen Members in Voice Channels"
    is Permission.MoveMembers -> "Move Members in Voice Channels"
    is Permission.UseVAD -> "Use VAD"
    is Permission.PrioritySpeaker -> "Priority Speaker"
    is Permission.ChangeNickname -> "Change Nickname"
    is Permission.ManageNicknames -> "Manage Member Nicknames"
    is Permission.ManageRoles -> "Manage Guild Roles"
    is Permission.ManageWebhooks -> "Manage Guild Webhooks"
    is Permission.ManageEmojis -> "Manage Guild Emojis"
    is Permission.ManageThreads -> "Manage Channel Threads"
    is Permission.CreatePrivateThreads -> "Create Private Threads"
    is Permission.CreatePublicThreads -> "Create Public Threads"
    is Permission.SendMessagesInThreads -> "Send Messages in Threads"
    is Permission.ManageGuild -> "Manage Guild"
    is Permission.ManageMessages -> "Manage Messages"
    is Permission.UseSlashCommands -> "Use /commands in Guild Channels"
    is Permission.RequestToSpeak -> "Request To Speak"
    is Permission.All -> "All"
}
