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

package sh.nino.api.endpoints

import dev.kord.cache.api.query
import dev.kord.core.Kord
import dev.kord.core.cache.data.UserData
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import kotlinx.coroutines.flow.count
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import sh.nino.commons.Constants
import sh.nino.commons.NinoInfo
import sh.nino.commons.extensions.asSnowflake
import sh.nino.commons.extensions.formatSize
import sh.nino.commons.extensions.reduceWith
import java.lang.management.ManagementFactory
import kotlin.time.Duration
import kotlin.time.DurationUnit

@kotlinx.serialization.Serializable
data class ShardInfo(
    var guilds: Int,
    var users: Int,
    val ping: Long
)

class InfoEndpoint(private val kord: Kord): AbstractEndpoint("/info") {
    override suspend fun call(call: ApplicationCall) {
        // Collect shard information
        val shardMap = mutableMapOf<Long, ShardInfo>()
        val guildShardMap = kord.guilds.map {
            ((it.id.value.toLong() shr 22) % kord.gateway.gateways.size) to it.id.value.toLong()
        }.toList()

        for ((id, guildID) in guildShardMap) {
            if (!shardMap.containsKey(id)) {
                val gatewayPing = kord.gateway.gateways[id.toInt()]?.ping?.value ?: Duration.ZERO

                shardMap[id] = ShardInfo(
                    0,
                    0,
                    gatewayPing.toLong(DurationUnit.MILLISECONDS)
                )
            }

            val shardInfo = shardMap[id]!!
            shardInfo.guilds += 1
            shardInfo.users += kord.getGuild(guildID.asSnowflake())!!.memberCount ?: 0

            shardMap[id] = shardInfo
        }

        // Get all users cached
        val users = kord.cache.query<UserData> {}.count()
        val channels = kord.guilds.reduceWith(0) { acc, guild ->
            val chan = guild.channels.count()
            acc + chan
        }

        val ping = kord.gateway.averagePing ?: Duration.ZERO
        val memory = ManagementFactory.getMemoryMXBean()

        call.respond(
            HttpStatusCode.OK,
            buildJsonObject {
                put("success", true)
                put(
                    "data",
                    buildJsonObject {
                        put("guilds", kord.guilds.count())
                        put("users", users)
                        put("channels", channels)
                        put("average_ping", ping.toLong(DurationUnit.MILLISECONDS))
                        put("version", NinoInfo.VERSION)
                        put("commit_sha", NinoInfo.COMMIT_HASH)
                        put("build_date", NinoInfo.BUILD_DATE)
                        put("dedi_node", Constants.dediNode)
                        put("memory_usage", memory.heapMemoryUsage.used.formatSize())
                        put(
                            "shards",
                            buildJsonArray {
                                for (shard in shardMap.values) {
                                    add(
                                        buildJsonObject {
                                            put("guilds", shard.guilds)
                                            put("users", shard.users)
                                            put("ping", shard.ping)
                                        }
                                    )
                                }
                            }
                        )
                    }
                )
            }
        )
    }
}
