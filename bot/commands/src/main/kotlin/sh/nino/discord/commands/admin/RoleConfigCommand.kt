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

import org.jetbrains.exposed.sql.update
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.commands.annotations.Subcommand
import sh.nino.discord.common.ID_REGEX
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.runSuspended
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.GuildSettings

@Command(
    name = "rolecfg",
    description = "descriptions.admin.rolecfg",
    aliases = ["roles", "role-config"],
    category = CommandCategory.ADMIN,
    examples = [
        "{prefix}rolecfg | View your current role configuration",
        "{prefix}rolecfg muted <@&roleId> | Sets the Muted role to that specific role by ID or snowflake.",
        "{prefix}rolecfg threads reset | Resets the No Threads role in the database."
    ],

    userPermissions = [0x00000020] // ManageGuild
)
class RoleConfigCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val guild = msg.message.getGuild()
        val mutedRole = runSuspended {
            if (msg.settings.mutedRoleId == null) {
                msg.locale.translate("generic.nothing")
            } else {
                val role = guild.getRole(msg.settings.mutedRoleId!!.asSnowflake())
                role.name
            }
        }

        val noThreadsRole = runSuspended {
            if (msg.settings.noThreadsRoleId == null) {
                msg.locale.translate("generic.nothing")
            } else {
                val role = guild.getRole(msg.settings.noThreadsRoleId!!.asSnowflake())
                role.name
            }
        }

        msg.replyTranslate(
            "commands.admin.rolecfg.message",
            mapOf(
                "guild" to guild.name,
                "mutedRole" to mutedRole,
                "noThreadsRole" to noThreadsRole
            )
        )
    }

    @Subcommand(
        "muted",
        "descriptions.admin.rolecfg.muted",
        aliases = ["m", "moot", "shutup"],
        usage = "<snowflake | \"reset\">"
    )
    suspend fun muted(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.replyTranslate("commands.admin.rolecfg.muted.noArgs")
            return
        }

        when (msg.args.first()) {
            "reset" -> {
                // Check if a muted role was not already defined
                if (msg.settings.mutedRoleId == null) {
                    msg.replyTranslate("commands.admin.rolecfg.muted.noMutedRole")
                    return
                }

                asyncTransaction {
                    GuildSettings.update({
                        GuildSettings.id eq msg.guild.id.value.toLong()
                    }) {
                        it[mutedRoleId] = null
                    }
                }

                msg.replyTranslate("commands.admin.rolecfg.muted.reset.success")
            }

            else -> {
                val roleId = msg.args.first()
                val role = msg.kord.defaultSupplier.getRoleOrNull(msg.guild.id, roleId.asSnowflake())

                // Check if it's a valid snowflake
                if (ID_REGEX.toRegex().matches(roleId)) {
                    if (role == null) {
                        msg.replyTranslate(
                            "commands.admin.rolecfg.unknownRole",
                            mapOf(
                                "roleId" to roleId
                            )
                        )

                        return
                    }

                    asyncTransaction {
                        GuildSettings.update({
                            GuildSettings.id eq msg.guild.id.value.toLong()
                        }) {
                            it[mutedRoleId] = roleId.toLong()
                        }
                    }

                    msg.replyTranslate(
                        "commands.admin.rolecfg.muted.set.success",
                        mapOf(
                            "name" to role.name
                        )
                    )
                }
            }
        }
    }

    @Subcommand(
        "noThreads",
        "descriptions.admin.rolecfg.noThreads",
        aliases = ["threads", "t"],
        usage = "<snowflake | \"reset\">"
    )
    suspend fun noThreads(msg: CommandMessage) {
        if (msg.args.isEmpty()) {
            msg.replyTranslate("commands.admin.rolecfg.noThreads.noArgs")
            return
        }

        when (msg.args.first()) {
            "reset" -> {
                // Check if a no threads role was not already defined
                if (msg.settings.noThreadsRoleId == null) {
                    msg.replyTranslate("commands.admin.rolecfg.noThreads.noRoleId")
                    return
                }

                asyncTransaction {
                    GuildSettings.update({
                        GuildSettings.id eq msg.guild.id.value.toLong()
                    }) {
                        it[noThreadsRoleId] = null
                    }
                }

                msg.replyTranslate("commands.admin.rolecfg.noThreads.reset.success")
            }

            else -> {
                val roleId = msg.args.first()
                val role = msg.kord.defaultSupplier.getRoleOrNull(msg.guild.id, roleId.asSnowflake())

                // Check if it's a valid snowflake
                if (ID_REGEX.toRegex().matches(roleId)) {
                    if (role == null) {
                        msg.replyTranslate(
                            "commands.admin.rolecfg.unknownRole",
                            mapOf(
                                "roleId" to roleId
                            )
                        )

                        return
                    }

                    asyncTransaction {
                        GuildSettings.update({
                            GuildSettings.id eq msg.guild.id.value.toLong()
                        }) {
                            it[mutedRoleId] = roleId.toLong()
                        }
                    }

                    msg.replyTranslate(
                        "commands.admin.rolecfg.noThreads.set.success",
                        mapOf(
                            "name" to role.name
                        )
                    )
                }
            }
        }
    }
}
