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

package sh.nino.discord.commands.admin

import dev.kord.common.DiscordTimestampStyle
import dev.kord.common.toMessageFormat
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.future.await
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.core.redis.RedisManager
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.GuildSettings

@Command(
    name = "import",
    description = "descriptions.admin.import",
    category = CommandCategory.ADMIN,
    aliases = ["i"],
    userPermissions = [0x00000020] // ManageGuild
)
class ImportCommand(private val redis: RedisManager, private val http: HttpClient): AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        if (msg.args.isEmpty()) {
            if (msg.attachments.isNotEmpty()) {
                return fromAttachment(msg)
            }

            val mapped = redis.commands.hgetall("nino:recovery:settings").await() as Map<String, String>
            val fromGuild = mapped.filter { it.key.startsWith(guild.id.toString()) }

            msg.reply {
                title = "[ Import Settings for ${guild.name} ]"
                description = buildString {
                    appendLine("You can revert back to previous settings using any ID available:")
                    appendLine("> **nino import <id-selected>**")
                    appendLine()
                    appendLine("Note that this only saves when you run the `export` command! If you want to revert")
                    appendLine("to a un-exported state, you can run this command with the file attachment that")
                    appendLine("was sent to you when you invoked the command and it'll revert from that stage.")
                    appendLine()

                    for (key in fromGuild.keys) {
                        val id = key.split(":").last()
                        appendLine("• **$id** (`nino import $id`)")
                    }
                }
            }

            return
        }

        val content = redis.commands.hget("nino:recovery:settings", "${guild.id}:${msg.args.first()}").await()
        if (content == null) {
            msg.reply("ID **${msg.args.first()}** doesn't exist.")
            return
        }

        val message = msg.reply("Now importing settings...")
        val decoded: ExportedGuildSettings
        try {
            decoded = Json.decodeFromString(ExportedGuildSettings.serializer(), content)
        } catch (e: Exception) {
            message.delete()
            msg.reply("Looks like an error has occurred. Did you import the right file? To be honest, I don't think you did...")

            return
        }

        asyncTransaction {
            GuildSettings.update({ GuildSettings.id eq guild.id.value.toLong() }) {
                it[usePlainModlogMessage] = decoded.usePlainMessages
                it[modlogWebhookUri] = decoded.modlogWebhookUri
                it[noThreadsRoleId] = decoded.noThreadsRoleId
                it[modlogChannelId] = decoded.modlogChannelId
                it[mutedRoleId] = decoded.mutedRoleId
                it[prefixes] = decoded.prefixes.toTypedArray()
                it[language] = decoded.language
            }
        }

        message.delete()
        redis.commands.hdel("nino:recovery:settings", "${guild.id}:${msg.args.first()}").await()
        msg.reply("Exported settings that was exported ${decoded.lastExportAt.toMessageFormat(DiscordTimestampStyle.RelativeTime)}")
    }

    private suspend fun fromAttachment(msg: CommandMessage) {
        val attachment = msg.attachments.first()
        val guild = msg.message.getGuild()

        if (!attachment.filename.endsWith(".json")) {
            msg.reply("This is not a valid JSON file.")
            return
        }

        val res: HttpResponse = http.get(attachment.url)
        if (res.status.value != 200) {
            msg.reply("Unable to retrieve file contents. Try again later?")
            return
        }

        val content = withContext(Dispatchers.IO) {
            res.receive<String>()
        }

        val message = msg.reply("Now importing from file **${attachment.filename}** that is ${attachment.size} bytes.")

        // We're using `Json` instead of the one from Koin since it'll ignore any unknown keys,
        // and we don't really want that to keep the type safety!
        val decoded: ExportedGuildSettings
        try {
            decoded = Json.decodeFromString(ExportedGuildSettings.serializer(), content)
        } catch (e: Exception) {
            message.delete()
            msg.reply("Looks like an error has occurred. Did you import the right file? To be honest, I don't think you did...")

            return
        }

        asyncTransaction {
            GuildSettings.update({ GuildSettings.id eq guild.id.value.toLong() }) {
                it[usePlainModlogMessage] = decoded.usePlainMessages
                it[modlogWebhookUri] = decoded.modlogWebhookUri
                it[noThreadsRoleId] = decoded.noThreadsRoleId
                it[modlogChannelId] = decoded.modlogChannelId
                it[mutedRoleId] = decoded.mutedRoleId
                it[prefixes] = decoded.prefixes.toTypedArray()
                it[language] = decoded.language
            }
        }

        message.delete()
        msg.reply("Exported settings that was exported ${decoded.lastExportAt.toMessageFormat(DiscordTimestampStyle.RelativeTime)}")
    }
}
