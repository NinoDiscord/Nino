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

package sh.nino.discord.punishments.builder

import dev.kord.core.entity.Attachment
import dev.kord.core.entity.Guild
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.VoiceChannel
import sh.nino.discord.database.tables.PunishmentType

data class PublishModLogData(
    val warningsRemoved: Int? = null,
    val warningsAdded: Int? = null,
    val attachments: List<Attachment> = listOf(),
    val moderator: User,
    val voiceChannel: VoiceChannel? = null,
    val reason: String? = null,
    val victim: User,
    val guild: Guild,
    val time: Int? = null,
    val type: PunishmentType
)

class PublishModLogBuilder {
    private val attachments: MutableList<Attachment> = mutableListOf()

    lateinit var moderator: User
    lateinit var victim: User
    lateinit var guild: Guild
    lateinit var type: PunishmentType

    var warningsRemoved: Int? = null
    var warningsAdded: Int? = null
    var voiceChannel: VoiceChannel? = null
    var reason: String? = null
    var time: Int? = null

    fun addAttachments(list: List<Attachment>): PublishModLogBuilder {
        attachments.addAll(list)
        return this
    }

    fun build(): PublishModLogData {
        require(this::moderator.isInitialized) { "Moderator is a required property to initialize." }
        require(this::victim.isInitialized) { "Victim is a required property to initialize." }
        require(this::guild.isInitialized) { "Guild is a required property to be initialized." }
        require(this::type.isInitialized) { "Punishment type is a required property to be initialized." }

        return PublishModLogData(
            warningsRemoved,
            warningsAdded,
            attachments,
            moderator,
            voiceChannel,
            reason,
            victim,
            guild,
            time,
            type
        )
    }
}
