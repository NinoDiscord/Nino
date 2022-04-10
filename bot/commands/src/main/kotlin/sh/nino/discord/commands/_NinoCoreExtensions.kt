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

package sh.nino.discord.commands

import sh.nino.discord.common.data.Config
import sh.nino.discord.common.extensions.asString
import sh.nino.discord.common.extensions.inject

// ok why is this here?
// this is here because :bot:core cannot correlate with :bot:commands

/**
 * This function returns an embed of the correspondent command available.
 */
suspend fun Command.help(msg: CommandMessage) = msg.reply {
    val cmd = this@help
    val config by inject<Config>()
    val prefix = config.prefixes.random()

    title = "[ \uD83D\uDD8C Command ${cmd.name} ]"
    description = try {
        msg.locale.translate("descriptions.${cmd.category.localeKey}.${cmd.name}")
    } catch (e: Exception) {
        "*hasn't been translated :<*"
    }

    field {
        name = "❯ Syntax"
        value = "`$prefix${cmd.name} ${cmd.usage.trim()}`"
        inline = false
    }

    field {
        name = "❯ Category"
        value = "${cmd.category.emoji} ${cmd.category.key}"
        inline = true
    }

    field {
        name = "❯ Aliases"
        value = cmd.aliases.joinToString(", ").ifEmpty { "None" }
        inline = true
    }

    field {
        name = "❯ Examples"
        value = cmd.examples.joinToString("\n") {
            it.replace("{prefix}", prefix)
        }.ifEmpty { "No examples were added." }

        inline = true
    }

    field {
        name = "❯ Cooldown"
        value = "${cmd.cooldown} seconds"
        inline = true
    }

    field {
        name = "❯ Constraints"
        value = buildString {
            appendLine("• **Owner Only**: ${if (cmd.ownerOnly) "Yes" else "No"}")
        }

        inline = true
    }

    field {
        name = "❯ User Permissions"
        value = buildString {
            if (cmd.userPermissions.values.isEmpty()) {
                appendLine("You do not require any permissions!")
            } else {
                for (perm in cmd.userPermissions.values.toTypedArray()) {
                    appendLine("• **${perm.asString()}**")
                }
            }
        }

        inline = true
    }

    field {
        name = "❯ Bot Permissions"
        value = buildString {
            if (cmd.botPermissions.values.isEmpty()) {
                appendLine("I do not require any permissions!")
            } else {
                for (perm in cmd.botPermissions.values.toTypedArray()) {
                    appendLine("• **${perm.asString()}**")
                }
            }
        }

        inline = true
    }
}

suspend fun Subcommand.help(msg: CommandMessage) = msg.reply {
    val subcmd = this@help
    val config by inject<Config>()
    val prefix = config.prefixes.random()

    title = "[ \uD83D\uDD8C Subcommand ${subcmd.parent.info.name} ${subcmd.name} ]"
    description = try {
        msg.locale.translate("descriptions.${subcmd.parent.info.category.localeKey}.${subcmd.parent.info.name}.${subcmd.name}")
    } catch (e: Exception) {
        "*not translated yet! :<*"
    }

    field {
        name = "❯ Syntax"
        value = "`$prefix${subcmd.parent.info.name} ${subcmd.name}${subcmd.usage.trim()}`".trim()
        inline = true
    }

    field {
        name = "❯ Aliases"
        value = subcmd.aliases.joinToString(", ").ifEmpty { "None" }
        inline = true
    }

    field {
        name = "❯ Permissions"
        value = buildString {
            if (subcmd.permissions.values.isEmpty()) {
                appendLine("You do not need any permissions to execute this command!")
            } else {
                for (perm in subcmd.permissions.values.toTypedArray()) {
                    appendLine("• **${perm.asString()}**")
                }
            }
        }

        inline = true
    }
}
