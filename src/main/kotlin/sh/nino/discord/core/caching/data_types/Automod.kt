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

package sh.nino.discord.core.caching.data_types

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import sh.nino.discord.core.database.tables.AutomodEntity

@Serializable
data class Automod(
    @SerialName("mention_threshold")
    val mentionThreshold: Int,

    @SerialName("exempted_channels")
    val omittedChannels: List<String>,

    @SerialName("exempted_users")
    val omittedUsers: List<String>,

    @SerialName("message_links")
    val messageLinks: Boolean,
    val dehoisting: Boolean,
    val shortlinks: Boolean,
    val blacklist: Boolean,
    val mentions: Boolean,
    val invites: Boolean,
    val spam: Boolean,
    val raid: Boolean,
    val id: String
) {
    companion object {
        fun fromEntity(entity: AutomodEntity) = Automod(
            entity.mentionThreshold,
            entity.omittedChannels.asList(),
            entity.omittedUsers.asList(),
            entity.messageLinks,
            entity.dehoisting,
            entity.shortlinks,
            entity.blacklist,
            entity.mentions,
            entity.invites,
            entity.spam,
            entity.raid,
            entity.id.value.toString()
        )
    }
}
