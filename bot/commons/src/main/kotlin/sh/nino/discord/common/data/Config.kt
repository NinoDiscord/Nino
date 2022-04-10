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

package sh.nino.discord.common.data

import dev.kord.common.entity.ActivityType
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Environment {
    @SerialName("development")
    Development,

    @SerialName("production")
    Production
}

@Serializable
data class Config(
    val defaultLocale: String = "en_US",
    val environment: Environment = Environment.Development,
    val sentryDsn: String? = null,
    val publicKey: String,
    val prefixes: List<String> = listOf("x!"),
    val botlists: BotlistsConfig? = null,
    val database: PostgresConfig = PostgresConfig(),
    val instatus: InstatusConfig? = null,
    val timeouts: TimeoutsConfig,
    val metrics: Boolean = false,
    val owners: List<String> = listOf(),
    val status: StatusConfig = StatusConfig(
        type = ActivityType.Game,
        status = "with {guilds} guilds [#{shard_id}] https://nino.sh"
    ),
    val redis: RedisConfig,
    val token: String,
    val ravy: String? = null,
    val api: ApiConfig? = null
)
