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

package sh.nino.discord.commands.admin.import

import dev.kord.rest.NamedFile
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.redisson.api.RedissonClient
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.core.database.tables.GuildEntity
import sh.nino.discord.core.database.transactions.asyncTransaction
import sh.nino.discord.kotlin.serializers.InstantSerializer
import sh.nino.discord.utils.RandomId
import java.io.ByteArrayInputStream
import java.time.Instant

@Serializable
data class ExportedGuildSettings(
    @SerialName("no_threads_role_id")
    val noThreadsRoleId: Long?,

    @SerialName("modlog_channel_id")
    val modlogChannelId: Long?,

    @SerialName("muted_role_id")
    val mutedRoleId: Long?,

    @Serializable(with = InstantSerializer::class)
    val lastExportAt: Instant,
    val prefixes: List<String>,
    val language: String
) {
    companion object {
        fun fromEntity(entity: GuildEntity): ExportedGuildSettings = ExportedGuildSettings(
            noThreadsRoleId = entity.noThreadsRoleId,
            modlogChannelId = entity.modlogChannelId,
            mutedRoleId = entity.mutedRoleId,
            lastExportAt = Instant.now(),
            prefixes = entity.prefixes.toList(),
            language = entity.language
        )
    }
}

@Command(
    name = "export",
    description = "descriptions.admin.export",
    category = CommandCategory.ADMIN,
    userPermissions = [0x00000020] // ManageGuild
)
class ExportCommand(private val redis: RedissonClient, private val json: Json): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        val message = msg.reply("Exporting guild settings...")
        val guild = msg.message.getGuild()

        val guildSettings = asyncTransaction {
            GuildEntity.findById(guild.id.value.toLong())!!
        }.execute()

        val export = ExportedGuildSettings.fromEntity(guildSettings)
        val jsonData = json.encodeToString(ExportedGuildSettings.serializer(), export)
        val id = RandomId.generate()

        // Save it to Redis
        val exportCache = redis.getMap<String, String>("nino:recovery:settings")
        exportCache.computeIfAbsent("${guild.id.asString}:$id") { jsonData }
        message.delete()

        val stream = ByteArrayInputStream(jsonData.toByteArray(Charsets.UTF_8))
        msg.reply(
            buildString {
                appendLine(":thumbsup: **Done!** — You can import these settings using the **import** command:")
                appendLine("> `nino import $id`")
                appendLine()
                appendLine("If you're curious on what we do with our data, please read our **Privacy Policy**: <https://nino.sh/privacy>")
            },
            listOf(
                NamedFile(
                    name = "${guild.id.asString}.json",
                    inputStream = stream
                )
            )
        )
    }
}
