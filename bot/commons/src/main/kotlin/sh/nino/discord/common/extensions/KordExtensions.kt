/*
 * Copyright (c) 2019-2022 Nino
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

package sh.nino.discord.common.extensions

import dev.kord.common.Color
import dev.kord.common.annotation.KordPreview
import dev.kord.common.entity.Snowflake
import dev.kord.core.event.Event
import dev.kord.core.event.channel.*
import dev.kord.core.event.channel.thread.*
import dev.kord.core.event.gateway.ReadyEvent
import dev.kord.core.event.gateway.ResumedEvent
import dev.kord.core.event.guild.*
import dev.kord.core.event.interaction.ApplicationCommandCreateEvent
import dev.kord.core.event.interaction.ApplicationCommandDeleteEvent
import dev.kord.core.event.interaction.ApplicationCommandUpdateEvent
import dev.kord.core.event.interaction.InteractionCreateEvent
import dev.kord.core.event.message.*
import dev.kord.core.event.role.RoleCreateEvent
import dev.kord.core.event.role.RoleDeleteEvent
import dev.kord.core.event.role.RoleUpdateEvent
import dev.kord.core.event.user.PresenceUpdateEvent
import dev.kord.core.event.user.UserUpdateEvent
import dev.kord.core.event.user.VoiceStateUpdateEvent
import java.awt.Color as AwtColor

fun AwtColor.asKordColor(): Color = Color(this.red, this.green, this.blue)
fun String.asSnowflake(): Snowflake = Snowflake(this)
fun Long.asSnowflake(): Snowflake = Snowflake(this)

@OptIn(KordPreview::class)
val Event.name: String
    get() = when (this) {
        is ResumedEvent -> "RESUMED"
        is ReadyEvent -> "READY"
        is ChannelCreateEvent -> "CHANNEL_CREATE"
        is ChannelUpdateEvent -> "CHANNEL_UPDATE"
        is ChannelDeleteEvent -> "CHANNEL_DELETE"
        is ChannelPinsUpdateEvent -> "CHANNEL_PINS_UPDATE"
        is TypingStartEvent -> "TYPING_START"
        is GuildCreateEvent -> "GUILD_CREATE"
        is GuildUpdateEvent -> "GUILD_UPDATE"
        is GuildDeleteEvent -> "GUILD_DELETE"
        is BanAddEvent -> "GUILD_BAN_ADD"
        is BanRemoveEvent -> "GUILD_BAN_REMOVE"
        is EmojisUpdateEvent -> "GUILD_EMOJIS_UPDATE"
        is IntegrationsUpdateEvent -> "GUILD_INTEGRATIONS_UPDATE"
        is MemberJoinEvent -> "GUILD_MEMBER_ADD"
        is MemberLeaveEvent -> "GUILD_MEMBER_REMOVE"
        is MemberUpdateEvent -> "GUILD_MEMBER_UPDATE"
        is RoleCreateEvent -> "GUILD_ROLE_CREATE"
        is RoleDeleteEvent -> "GUILD_ROLE_DELETE"
        is RoleUpdateEvent -> "GUILD_ROLE_UPDATE"
        is MembersChunkEvent -> "GUILD_MEMBERS_CHUNK"
        is InviteCreateEvent -> "INVITE_CREATE"
        is InviteDeleteEvent -> "INVITE_DELETE"
        is MessageCreateEvent -> "MESSAGE_CREATE"
        is MessageUpdateEvent -> "MESSAGE_UPDATE"
        is MessageDeleteEvent -> "MESSAGE_DELETE"
        is MessageBulkDeleteEvent -> "MESSAGE_DELETE_BULK"
        is ReactionAddEvent -> "MESSAGE_REACTION_ADD"
        is ReactionRemoveEvent -> "MESSAGE_REACTION_REMOVE"
        is ReactionRemoveEmojiEvent -> "MESSAGE_REACTION_REMOVE_EMOJI"
        is PresenceUpdateEvent -> "PRESENCE_UPDATE"
        is UserUpdateEvent -> "USER_UPDATE"
        is VoiceStateUpdateEvent -> "VOICE_STATE_UPDATE"
        is VoiceServerUpdateEvent -> "VOICE_SERVER_UPDATE"
        is WebhookUpdateEvent -> "WEBHOOKS_UPDATE"
        is InteractionCreateEvent -> "INTERACTION_CREATE"
        is ApplicationCommandCreateEvent -> "APPLICATION_COMMAND_CREATE"
        is ApplicationCommandDeleteEvent -> "APPLICATION_COMMAND_DELETE"
        is ApplicationCommandUpdateEvent -> "APPLICATION_COMMAND_UPDATE"
        is ThreadChannelCreateEvent -> "THREAD_CREATE"
        is ThreadChannelDeleteEvent -> "THREAD_DELETE"
        is ThreadUpdateEvent -> "THREAD_UPDATE"
        is ThreadListSyncEvent -> "THREAD_LIST_SYNC"
        is ThreadMemberUpdateEvent -> "THREAD_MEMBER_UPDATE"
        is ThreadMembersUpdateEvent -> "THREAD_MEMBERS_UPDATE"
        is GuildScheduledEventCreateEvent -> "GUILD_SCHEDULED_EVENT_CREATE"
        is GuildScheduledEventDeleteEvent -> "GUILD_SCHEDULED_EVENT_DELETE"
        is GuildScheduledEventUpdateEvent -> "GUILD_SCHEDULED_EVENT_UPDATE"
        is GuildScheduledEventUserAddEvent -> "GUILD_SCHEDULED_EVENT_USER_ADD"
        is GuildScheduledEventUserRemoveEvent -> "GUILD_SCHEDULED_EVENT_USER_REMOVE"
        else -> "UNKNOWN (${this::class})"
    }
