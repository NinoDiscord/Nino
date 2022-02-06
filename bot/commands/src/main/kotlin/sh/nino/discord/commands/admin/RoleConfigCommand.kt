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

import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.runSuspended

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
}
