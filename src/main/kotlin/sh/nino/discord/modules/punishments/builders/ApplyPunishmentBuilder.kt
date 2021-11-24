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

package sh.nino.discord.modules.punishments.builders

import dev.kord.core.entity.Attachment

data class ApplyPunishmentOptions(
    val attachments: List<String> = listOf(),
    val shouldPublish: Boolean = true,
    val reason: String? = null,
    val soft: Boolean = false,
    val time: Int? = null,
    val days: Int? = null
)

/**
 * Represents a builder class to apply a punishment to a user using the [PunishmentModule.apply][sh.nino.discord.modules.punishments.PunishmentsModule.apply]
 * function. Returns a new [ApplyPunishmentOptions] object.
 */
class ApplyPunishmentBuilder {
    private var attachments: MutableList<String> = mutableListOf()

    /**
     * Returns if we should publish this punishment to the mod-log, if any.
     */
    var publish: Boolean = true

    /**
     * Returns the reason why this action was executed.
     */
    var reason: String? = null

    /**
     * WARN: This only applies to bans.
     *
     * This returns if the member should be unbanned after.
     */
    var soft: Boolean = false

    /**
     * WARN: This only applies to bans and mutes.
     *
     * Returns the time the member should be unmuted/unbanned.
     */
    var time: Int? = null

    /**
     * WARN: This only applies to bans only.
     *
     * Returns how many days to bulk-delete messages.
     */
    var days: Int? = null

    /**
     * Adds a list of [Attachments][Attachment] that you can *possibly* view.
     * @param all All the attachments to list
     */
    fun addAttachments(all: List<Attachment>) {
        for (a in all) {
            attachments.add(a.url)
        }
    }

    /**
     * Creates a new [ApplyPunishmentOptions] block.
     */
    fun build(): ApplyPunishmentOptions = ApplyPunishmentOptions(
        attachments = attachments.toList(),
        publish,
        reason,
        soft,
        time,
        days
    )
}
