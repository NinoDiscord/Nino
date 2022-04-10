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

package sh.nino.discord.commands.admin

import dev.kord.rest.NamedFile
import kotlinx.coroutines.future.await
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.RandomId
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.GuildSettingsEntity
import java.io.ByteArrayInputStream

@Serializable
data class ExportedGuildSettings(
    @SerialName("modlog_webhook_uri")
    val modlogWebhookUri: String?,

    @SerialName("use_plain_messages")
    val usePlainMessages: Boolean,

    @SerialName("no_threads_role_id")
    val noThreadsRoleId: Long?,

    @SerialName("modlog_channel_id")
    val modlogChannelId: Long?,

    @SerialName("muted_role_id")
    val mutedRoleId: Long?,

    @SerialName("last_export_at")
    val lastExportAt: Instant,
    val prefixes: List<String>,
    val language: String
) {
    companion object {
        fun fromEntity(entity: GuildSettingsEntity): ExportedGuildSettings = ExportedGuildSettings(
            modlogWebhookUri = entity.modlogWebhookUri,
            usePlainMessages = entity.usePlainModlogMessage,
            noThreadsRoleId = entity.noThreadsRoleId,
            modlogChannelId = entity.modlogChannelId,
            mutedRoleId = entity.mutedRoleId,
            lastExportAt = Clock.System.now(),
            prefixes = entity.prefixes.toList(),
            language = entity.language
        )
    }
}

@Command(
    name = "export",
    description = "descriptions.admin.export",
    category = CommandCategory.ADMIN,
    aliases = ["ex"],
    userPermissions = [0x00000020] // ManageGuild
)
class ExportCommand(private val redis: RedisManager, private val json: Json): AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val message = msg.reply("Now exporting guild settings...")
        val guild = msg.message.getGuild()

        val guildSettings = asyncTransaction {
            GuildSettingsEntity.findById(guild.id.value.toLong())!!
        }

        val exportedData = ExportedGuildSettings.fromEntity(guildSettings)
        val jsonData = json.encodeToString(ExportedGuildSettings.serializer(), exportedData)

        // Save it to Redis
        val id = RandomId.generate()
        redis.commands.hset(
            "nino:recovery:settings",
            mapOf(
                "${guild.id}:$id" to jsonData
            )
        ).await()

        message.delete()

        val bais = ByteArrayInputStream(jsonData.toByteArray(Charsets.UTF_8))
        msg.replyFile(
            buildString {
                appendLine(":thumbsup: **Done!** — You can import the exact settings below using the **import** command:")
                appendLine("> **nino import $id**")
                appendLine()
                appendLine("If you were curious on what this data is, you can read from our docs: **https://nino.sh/docs/exporting-settings**")
                appendLine("Curious on what we do with your data? Read our privacy policy: **https://nino.sh/privacy**")
            },
            listOf(
                NamedFile(
                    name = "${guild.id}-settings.json",
                    inputStream = bais
                )
            )
        )
    }
}
