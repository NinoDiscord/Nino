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

package sh.nino.discord.commands.core

import dev.kord.core.Kord
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.command.CommandHandler
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.data.Config
import sh.nino.discord.extensions.asString
import sh.nino.discord.extensions.sort
import sh.nino.discord.extensions.toTitleCase
import sh.nino.discord.utils.Constants
import sh.nino.discord.core.command.Command as BaseCommand

@Command(
    name = "help",
    description = "descriptions.core.help",
    aliases = ["halp", "h", "?", "cmds", "commands"],
    usage = "[cmdOrModule]"
)
class HelpCommand(
    private val handler: CommandHandler,
    private val config: Config,
    private val kord: Kord
): AbstractCommand() {

    override suspend fun run(msg: CommandMessage) = if (msg.args.isEmpty())
        renderHelpCommand(msg)
    else
        renderCommandHelp(msg)

    private suspend fun renderHelpCommand(msg: CommandMessage) {
        // Sort commands by their category
        val categoryMap = mutableMapOf<CommandCategory, MutableList<BaseCommand>>()
        for (cmd in handler.commands.values) {
            // Do not return easter egg or system commands.
            if (cmd.category == CommandCategory.SYSTEM || cmd.category == CommandCategory.EASTER_EGG) continue
            if (!categoryMap.contains(cmd.category))
                categoryMap[cmd.category] = mutableListOf()

            categoryMap[cmd.category]!!.add(cmd)
        }

        val prefix = try {
            msg.settings.prefixes.random()
        } catch (e: NoSuchElementException) {
            config.prefixes.random()
        }

        // Return a pretty embed 🥺
        val self = kord.getSelf()
        msg.replyEmbed {
            title = "${self.username}#${self.discriminator} | Commands"
            description = buildString {
                appendLine(":pencil2: For more documentation, you can type **${prefix}help <cmdOrModule>**, in which, **<cmdOrModule>** is the module or command you want to view.")
                appendLine()
                appendLine("More information and a prettier UI for commands or modules can be viewed on the [website](https://nino.sh/commands).")
                appendLine("There are currently **${handler.commands.size}** available commands.")
            }

            for ((cat, cmds) in categoryMap) {
                field {
                    name = "${cat.emoji} ${cat.category}"
                    value = cmds.joinToString(", ") { "**`${it.name}`**" }
                    inline = false
                }
            }
        }
    }

    private suspend fun renderCommandHelp(msg: CommandMessage) {
        val arg = msg.args.first()
        val prefix = try {
            msg.settings.prefixes.random()
        } catch (e: NoSuchElementException) {
            config.prefixes.random()
        }

        if (arg == "usage") {
            msg.replyEmbed {
                title = "[ Command Usage ]"
                color = Constants.COLOR
                description = buildString {
                    appendLine("> **This is a guide on how to understand the arguments system**")
                    appendLine("> **This is also present on the [website](https://nino.sh/docs/getting-started/syntax)!**")
                    appendLine()
                    appendLine("A command's syntax might look like: `${prefix}help [cmdOrModule]`")
                    appendLine()
                    appendLine("```")
                    appendLine("|-----------------------------------------------------|")
                    appendLine("|                                                     |")
                    appendLine("|      x!    help      [ cmdOrMod   |   \"usage\"]      |")
                    appendLine("|      ^       ^       ^   ^        ^   ^             |")
                    appendLine("|      |       |       |   |        |   |             |")
                    appendLine("|      |       |       |   |        |   |             |")
                    appendLine("|      |       |       |  /         |   |             |")
                    appendLine("|      |       |       | /          |   |             |")
                    appendLine("|      |       |       |/ - name    |   |             |")
                    appendLine("|      |       |       |            |   |             |")
                    appendLine("|    prefix command  param         \"or\" literal       |")
                    appendLine("|-----------------------------------------------------|")
                    appendLine("```")
                    appendLine()
                    appendLine("To break down this thing I shown you above:")
                    appendLine("  - **prefix** refers to the command prefix.")
                    appendLine("  - **command** is the command name or alias.")
                    appendLine("  - **param** is referred to a parameter (or an argument) which can be in `[` or `<`.")
                    appendLine("     - **name** is the param name, nothing much.")
                    appendLine("     - **[]** is an optional argument, so it is not required.")
                    appendLine("     - **<>** is a required argument, it is required to be added.")
                    appendLine()
                    appendLine("In Nino v**2.x**+, we added slash commands to every guild (and some secret ones to some guilds)")
                    appendLine("to making commands, hopefully, efficient as possible.")
                }
            }

            return
        }

        val command = handler.commands.values.firstOrNull {
            (it.name == arg || it.aliases.contains(arg)) && (it.category != CommandCategory.EASTER_EGG && it.category != CommandCategory.SYSTEM)
        }

        if (command != null) {
            msg.replyEmbed {
                title = "[ \uD83D\uDD8C️ Command ${command.name} ]"
                description = msg.locale.translate(command.description)

                field {
                    name = "❯ Syntax"
                    value = "`$prefix${command.name} ${command.usage.trim()}`"
                    inline = false
                }

                field {
                    name = "❯ Category"
                    value = "${command.category.emoji} **${command.category.category}**"
                    inline = true
                }

                field {
                    name = "❯ Alias(es)"
                    value = command.aliases.joinToString(", ").ifEmpty { "None" }
                    inline = true
                }

                field {
                    name = "❯ Examples"
                    value = command.examples.joinToString("\n") { it.replace("{prefix}", prefix) }.ifEmpty { "No examples were provided." }
                    inline = true
                }

                field {
                    name = "❯ Conditions"
                    value = buildString {
                        appendLine("• **Owner Only**: ${if (command.ownerOnly) "Yes" else "No"}")
                    }

                    inline = true
                }

                field {
                    name = "❯ Cooldown"
                    value = "${command.cooldown}s"
                    inline = true
                }

                field {
                    name = "❯ Permissions"
                    value = buildString {
                        appendLine("**User**:")
                        if (command.userPermissions.values.isEmpty()) {
                            appendLine("• **None**")
                        } else {
                            for (perm in command.userPermissions.values.toTypedArray()) {
                                appendLine("• ${perm.asString()}")
                            }
                        }

                        appendLine()
                        appendLine("**Bot**:")
                        if (command.botPermissions.values.isEmpty()) {
                            appendLine("• **None**")
                        } else {
                            for (perm in command.botPermissions.values.toTypedArray()) {
                                appendLine("• ${perm.asString()}")
                            }
                        }
                    }

                    inline = true
                }
            }
        } else {
            val module = handler.commands.values.filter {
                it.category.category.lowercase() == arg.lowercase() && !listOf("system", "easter_egg").contains(arg.lowercase())
            }

            if (module.isNotEmpty()) {
                val propLen = { name: String -> name.length }
                val longestCmdName = propLen(module.sort { a, b -> propLen(b.name) - propLen(a.name) }.first().name)

                msg.replyEmbed {
                    title = "[ Module ${arg.toTitleCase()} ]"
                    description = buildString {
                        for (c in module) {
                            appendLine("`${c.name.padEnd((longestCmdName * 2) - c.name.length, '\u200b')}` | \u200b \u200b**${msg.locale.translate(c.description)}**")
                        }
                    }
                }
            } else {
                msg.reply(":question: Command or module **$arg** was not found.")
                return
            }
        }
    }
}
