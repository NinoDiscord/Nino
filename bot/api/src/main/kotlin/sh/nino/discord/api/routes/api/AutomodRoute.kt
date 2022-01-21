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

@file:Suppress("UNUSED")
package sh.nino.discord.api.routes.api

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import sh.nino.discord.api.Endpoint
import sh.nino.discord.api.annotations.Route
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.AutomodEntity

@Serializable
data class AutomodData(
    @SerialName("account_age_day_threshold")
    val accountAgeDayThreshold: Int,

    @SerialName("mentions_threshold")
    val mentionsThreshold: Int,

    @SerialName("omitted_channels")
    val omittedChannels: List<Long>,

    @SerialName("omitted_users")
    val omittedUsers: List<Long>,

    @SerialName("account_age")
    val accountAge: Boolean,
    val dehoisting: Boolean,
    val shortlinks: Boolean,
    val blacklist: Boolean,
    val toxicity: Boolean,
    val phishing: Boolean,
    val mentions: Boolean,
    val invites: Boolean,
    val spam: Boolean,
    val raid: Boolean
) {
    companion object {
        fun fromEntity(entity: AutomodEntity): AutomodData = AutomodData(
            entity.accountAgeDayThreshold,
            entity.mentionThreshold,
            entity.omittedChannels.toList(),
            entity.omittedUsers.toList(),
            entity.accountAge,
            entity.dehoisting,
            entity.shortlinks,
            entity.blacklist,
            entity.toxicity,
            entity.phishing,
            entity.mentions,
            entity.invites,
            entity.spam,
            entity.raid
        )
    }
}

class AutomodRoute: Endpoint("/api/v1/automod") {
    @Route("/", "get")
    suspend fun get(call: ApplicationCall) {
        call.respond(
            HttpStatusCode.NotFound,
            ApiResponse(
                message = "Cannot GET /api/v1/automod - missing guild id as key."
            )
        )
    }

    @Route("/{guildId}", "get")
    suspend fun getFromGuild(call: ApplicationCall) {
        val guildId = call.parameters["guildId"]
        val entity = asyncTransaction {
            AutomodEntity.findById(guildId!!.toLong())
        }

        if (entity == null) {
            call.respond(
                HttpStatusCode.NotFound,
                ApiResponse(
                    message = "Cannot find automod settings for guild '$guildId'"
                )
            )

            return
        }

        return call.respond(HttpStatusCode.OK, AutomodData.fromEntity(entity))
    }
}
