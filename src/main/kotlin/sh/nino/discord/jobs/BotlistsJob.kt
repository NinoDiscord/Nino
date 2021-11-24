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

package sh.nino.discord.jobs

import dev.floofy.haru.abstractions.AbstractJob
import dev.kord.core.Kord
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.count
import kotlinx.serialization.json.JsonObject
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.asJson
import sh.nino.discord.kotlin.logging

private data class BotlistResult(
    val list: String,
    val success: Boolean,
    val time: Long
)

class BotlistsJob(
    private val config: Config,
    private val httpClient: HttpClient,
    private val kord: Kord
): AbstractJob(
    name = "nino:botlists",
    expression = "*/15 * * * *"
) {
    private val logger by logging<BotlistsJob>()

    override suspend fun execute() {
        if (config.botlists == null) return

        logger.info("Checking if api keys are present...")

        val botId = kord.selfId.asString
        val guildCount = kord.guilds.count()
        val shards = kord.gateway.gateways.count()
        var success = 0
        var errored = 0
        val listing = mutableListOf<BotlistResult>()

        // builderman botlist
        if (config.botlists.dservices != null) {
            logger.info("|- Discord Services token is present!")

            val dservicesStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://api.discordservices.net/bot/$botId/stats") {
                header("Authorization", config.botlists.dservices)
                body = JsonObject(
                    mapOf(
                        "server_count" to guildCount.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "Discord Services",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - dservicesStartAt
                )
            )
        }

        // bleh
        if (config.botlists.dboats != null) {
            logger.info("|- Discord Boats token is present!")

            val dboatsStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://discord.boats/api/bot/$botId") {
                header("Authorization", config.botlists.dboats)
                body = JsonObject(
                    mapOf(
                        "server_count" to guildCount.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "discord.boats",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - dboatsStartAt
                )
            )
        }

        // good botlist
        if (config.botlists.dbots != null) {
            logger.info("|- Discord Bots token is present!")

            val dbotsStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://discord.bots.gg/api/v1/bot/$botId/stats") {
                header("Authorization", config.botlists.dbots)
                body = JsonObject(
                    mapOf(
                        "guildCount" to guildCount.asJson(),
                        "shardCount" to shards.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "discord.bots.gg",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - dbotsStartAt
                )
            )
        }

        // bleh
        if (config.botlists.topgg != null) {
            logger.info("|- top.gg token is present!")

            val dbotsStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://top.gg/api/bots/$botId/stats") {
                header("Authorization", config.botlists.topgg)
                body = JsonObject(
                    mapOf(
                        "server_count" to guildCount.asJson(),
                        "shard_count" to shards.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "discord.bots.gg",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - dbotsStartAt
                )
            )
        }

        // cutie boyfriend, carrot, and blob botlist :fifiHappy:
        if (config.botlists.delly != null) {
            logger.info("|- Found Delly token, now posting...")

            val dellyStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://api.discordextremelist.xyz/v2/bot/$botId/stats") {
                header("Authorization", config.botlists.delly)
                body = JsonObject(
                    mapOf(
                        "guildCount" to guildCount.asJson(),
                        "shardCount" to shards.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "Delly",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - dellyStartAt
                )
            )
        }

        if (config.botlists.discords != null) {
            logger.info("|- discords.com token was found, now posting...")

            val discordsStartAt = System.currentTimeMillis()
            val res = httpClient.post<HttpResponse>("https://discords.com/bots/api/v1/$botId") {
                header("Authorization", config.botlists.discords)
                body = JsonObject(
                    mapOf(
                        "server_count" to guildCount.asJson()
                    )
                )
            }

            if (res.status == HttpStatusCode.OK)
                success += 1
            else
                errored += 1

            listing.add(
                BotlistResult(
                    "discords.com",
                    res.status == HttpStatusCode.OK,
                    System.currentTimeMillis() - discordsStartAt
                )
            )
        }

        val successRate = (success.toDouble() / listing.size.toDouble()) * 100
        logger.info("$success/$errored ($successRate% rate) to ${listing.size} lists.")

        for (list in listing) {
            logger.info("   * ${if (list.success) "✔" else "❌"} ${list.list} (~${list.time}ms)")
        }
    }
}
