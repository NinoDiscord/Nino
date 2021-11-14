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
    expression = ""
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

        // cutie boyfriend, carrot, and bolb botlist :fifiHappy:
        if (config.botlists.delly != null) {
        }
    }
}

/*
    // Ice is a cute boyfriend btw <3
    if (botlists.delly !== undefined) {
      this.logger.info('Found Discord Extreme List token, now posting...');

      await this.http
        .request({
          url: `https://api.discordextremelist.xyz/v2/bot/${this.discord.client.user.id}/stats`,
          method: 'POST',
          data: {
            guildCount: this.discord.client.guilds.size,
            shardCount: this.discord.client.shards.size,
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': botlists.delly,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Delly',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) => this.logger.warn('Unable to parse JSON [Delly]:', ex));
    }

    if (botlists.bfd !== undefined) {
      this.logger.info('Found Bots for Discord token, now posting...');

      const res = await this.http
        .request({
          method: 'POST',
          url: `https://botsfordiscord.com/api/bot/${this.discord.client.user.id}`,
          data: {
            server_count: this.discord.client.guilds.size,
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': botlists.bfd,
          },
        })
        .then((res) => {
          res.statusCode === 200 ? success++ : errored++;
          list.push({
            name: 'Bots for Discord',
            success: res.statusCode === 200,
            data: res.json(),
          });
        })
        .catch((ex) => this.logger.warn('Unable to parse JSON [Bots for Discord]:', ex));
    }

    const successRate = ((success / list.length) * 100).toFixed(2);
    this.logger.info(
      [
        `ℹ️ listly posted to ${list.length} botlists with a success rate of ${successRate}%`,
        'Serialized output will be displayed:',
      ].join('\n')
    );

    for (const botlist of list) {
      this.logger.info(`${botlist.success ? '✔' : '❌'} ${botlist.name}`, botlist.data);
    }
 */
