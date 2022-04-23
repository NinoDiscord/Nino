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

package sh.nino.core.jobs

import dev.kord.core.Kord
import gay.floof.utils.slf4j.logging
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.apache.commons.lang3.time.StopWatch
import sh.nino.commons.data.Config
import sh.nino.core.timers.Job
import java.util.concurrent.TimeUnit

private data class BotlistResult(
    val name: String,
    val success: Boolean,
    val time: Long,
    val data: JsonObject
)

class BotListsJob(
    private val config: Config,
    private val httpClient: HttpClient,
    private val kord: Kord
): Job(
    name = "botlists",
    interval = 86400000
) {
    private val logger by logging<BotListsJob>()

    override suspend fun execute() {
        if (config.botlists == null) return

        val guilds = kord.guilds.toList().size
        val shardCount = kord.gateway.gateways.size
        val data = mutableListOf<BotlistResult>()
        val botlistWatch = StopWatch.createStarted()

        if (config.botlists!!.discordServicesToken != null) {
            logger.info("* Found discordservices.net token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://api.discordservices.net/bot/${kord.selfId}/stats") {
                body

                header("Authorization", config.botlists!!.discordServicesToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "discordservices.net",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        if (config.botlists!!.discordBoatsToken != null) {
            logger.info("* Found discord.boats token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://discord.boats/api/bot/${kord.selfId}") {
                setBody(JsonObject(
                    mapOf(
                        "server_count" to JsonPrimitive(guilds)
                    )
                ))

                header("Authorization", config.botlists!!.discordBoatsToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "discord.boats",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        if (config.botlists!!.discordBotsToken != null) {
            logger.info("* Found discord.bots.gg token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://discord.bots.gg/api/v1/bots/${kord.selfId}/stats") {
                setBody(
                    JsonObject(
                        mapOf(
                            "guildCount" to JsonPrimitive(guilds),
                            "shardCount" to JsonPrimitive(shardCount)
                        )
                    )
                )

                header("Authorization", config.botlists!!.discordBotsToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "discord.bots.gg",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        if (config.botlists!!.discordsToken != null) {
            logger.info("* Found discords.com token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://discords.com/bots/api/${kord.selfId}") {
                setBody(JsonObject(
                    mapOf(
                        "server_count" to JsonPrimitive(guilds)
                    )
                ))

                header("Authorization", config.botlists!!.discordsToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "discords.com",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        if (config.botlists!!.topGGToken != null) {
            logger.info("* Found top.gg token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://top.gg/api/bots/${kord.selfId}/stats") {
                setBody(JsonObject(
                    mapOf(
                        "server_count" to JsonPrimitive(guilds),
                        "shard_count" to JsonPrimitive(shardCount)
                    )
                ))

                header("Authorization", config.botlists!!.topGGToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "top.gg",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        // botlist by a cute fox, a carrot, and a funny api blob
        if (config.botlists!!.dellyToken != null) {
            logger.info("* Found Delly (Discord Extreme List) token!")

            val stopwatch = StopWatch.createStarted()
            val res: HttpResponse = httpClient.post("https://api.discordextremelist.xyz/v2/bot/${kord.selfId}/stats") {
                setBody(JsonObject(
                    mapOf(
                        "guildCount" to JsonPrimitive(guilds),
                        "shardCount" to JsonPrimitive(shardCount)
                    )
                ))

                header("Authorization", config.botlists!!.dellyToken)
            }

            stopwatch.stop()
            val success = res.status.isSuccess()
            val json = withContext(Dispatchers.IO) {
                res.body<JsonObject>()
            }

            data.add(
                BotlistResult(
                    "Delly",
                    success,
                    stopwatch.time,
                    json
                )
            )
        }

        botlistWatch.stop()
        logger.info("Took ${botlistWatch.getTime(TimeUnit.MILLISECONDS)}ms to post to ${data.size} bot lists.")

        logger.info("----------")
        for (list in data) {
            logger.info("|- ${list.name}")
            logger.info("\\- Took ${list.time}ms to post data.")
            logger.info("\\- ${if (list.success) "and it was successful" else "was not successful"}")
            logger.info(list.data.toString())
        }
        logger.info("----------")
    }
}
