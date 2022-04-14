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

package sh.nino.modules.punishments.builders

import dev.kord.core.entity.Attachment
import dev.kord.core.entity.channel.VoiceChannel

/**
 * The data when you fun the [ApplyPunishmentBuilder.build] method.
 */
data class ApplyPunishmentData(
    /**
     * Returns the [voice channel][VoiceChannel] that is applied to this punishment.
     *
     * This is only tied to the following punishment types:
     *  - [PunishmentType.VOICE_UNDEAFEN]
     *  - [PunishmentType.VOICE_DEAFEN]
     *  - [PunishmentType.VOICE_UNMUTE]
     *  - [PunishmentType.VOICE_MUTE]
     */
    val voiceChannel: VoiceChannel? = null,

    /**
     * Returns a list of attachments to use to provide more evidence within a certain case.
     */
    val attachments: List<Attachment> = listOf(),

    /**
     * If we should publish this case to the mod-log.
     */
    val publish: Boolean = true,

    /**
     * The reason why this action was taken care of.
     */
    val reason: String? = null,

    /**
     * How much time in milliseconds this action should revert.
     */
    val time: Int? = null,

    val roleId: Long? = null,
    val soft: Boolean = false,
    val days: Int = 7
)

class ApplyPunishmentBuilder {
    var voiceChannel: VoiceChannel? = null
    var attachments: List<Attachment> = listOf()
    var publish: Boolean = true
    var reason: String? = null
    var roleId: Long? = null
    var time: Int? = null
    var soft: Boolean = false
    var days: Int = 7

    fun build(): ApplyPunishmentData = ApplyPunishmentData(
        voiceChannel,
        attachments,
        publish,
        reason,
        time,
        roleId,
        soft,
        days
    )
}
