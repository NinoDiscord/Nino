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

package sh.nino.discord.commands.core

import dev.kord.core.Kord
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandHandler
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.data.Config
import java.util.*

@Command(
    name = "help",
    description = "descriptions.core.help",
    aliases = ["halp", "?", "h", "cmds", "command"]
)
class HelpCommand(private val handler: CommandHandler, private val config: Config, private val kord: Kord): AbstractCommand() {
    private val commandByCategoryCache = mutableMapOf<CommandCategory, MutableList<sh.nino.discord.commands.Command>>()

    override suspend fun execute(msg: CommandMessage) = if (msg.args.isEmpty()) renderHelpCommand(msg) else renderCommandHelp(msg)

    private suspend fun renderHelpCommand(msg: CommandMessage) {
        // Cache the commands by their category if the cache is empty
        if (commandByCategoryCache.isEmpty()) {
            for (command in handler.commands.values) {
                // We do not add easter eggs + system commands
                if (command.category == CommandCategory.SYSTEM || command.category == CommandCategory.EASTER_EGG) continue

                // Check if it was cached
                if (!commandByCategoryCache.containsKey(command.category))
                    commandByCategoryCache[command.category] = mutableListOf()

                commandByCategoryCache[command.category]!!.add(command)
            }
        }

        val prefixes = (msg.settings.prefixes + msg.userSettings.prefixes + config.prefixes).distinct()
        val prefix = prefixes.random()

        val self = kord.getSelf()
        msg.reply {
            title = "${self.username}#${self.discriminator} | Command List"
            description = buildString {
                appendLine(":pencil2: For more documentation on a command, you can type [${prefix}help <cmdOrModule>](https://nino.sh/commands), replace **<cmdOrModule>** is the command or module you want to view.")
                appendLine()
                appendLine("There are currently **${handler.commands.size}** commands available.")
                appendLine("[**Privacy Policy**](https://nino.sh/privacy) `|` [**Terms of Service**](https://nino.sh/tos)")
            }

            for ((cat, commands) in commandByCategoryCache) {
                field {
                    name = "${cat.emoji} ${cat.key}"
                    value = commands.joinToString(", ") { "**`${it.name}`**" }
                    inline = false
                }
            }
        }
    }

    private suspend fun renderCommandHelp(msg: CommandMessage) {
        // You can basically do "nino <command> [subcommand] -h" to execute the subcommand's
        // information or do "nino <command> -h" to execute the command's information.
        //
        // BUT! In the help command, if you do "nino help <command> [subcommand]",
        // it will run the subcommand's information, and if you do "nino help <commandOrModule>"
        // it'll render the command or module's information

        val prefixes = (msg.settings.prefixes + msg.userSettings.prefixes + config.prefixes).distinct()
        val prefix = prefixes.random()
        val arg = msg.args.first()

        if (arg == "usage") {
            msg.reply {
                title = "[ Nino's Command Usage Guide ]"
                description = buildString {
                    appendLine("Hallo **${msg.author.tag}**! I am here to help you on how to do arguments for text-based commands")
                    appendLine("when using me for your moderation needs! A more of a detailed guide can be seen on my [website](https://nino.sh/docs/getting-started/syntax)!")
                    appendLine("To see what I mean, I will give you a visualization of the arguments broken down:")
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
                    appendLine("If you didn't get this visualization, that's completely alright! I'll give you a run down:")
                    appendLine("- **prefix** refers to the command prefix you executed, like **${prefixes.random()}**!")
                    appendLine("- **command** refers to the command's name or the alias of that executed command.")
                    appendLine("- **param** is referred to a command parameter, or an argument! It'll be referenced with the prefix of `[` or `<`")
                    appendLine("  If a parameter starts with `[`, it is referred as a optional argument, so you don't need to use it!")
                    appendLine("  If a parameter starts with `<`, it is referred as a required argument, so you are required to specify an argument or the command will not work. :<")
                    appendLine("In the **2.x** release of Nino, we added the ability to use slash commands when executing commands, but it is very limiting!")
                }
            }

            return
        }

        // Check if there is 2 arguments supplied
        if (msg.args.size == 2) {
            val (command, subcommand) = msg.args
            val cmd = handler.commands.values.firstOrNull {
                (it.name == command || it.aliases.contains(command)) && (it.category != CommandCategory.EASTER_EGG && it.category != CommandCategory.SYSTEM)
            }

            if (cmd != null) {
                val subcmd = cmd.thiz.subcommands.firstOrNull {
                    it.name == subcommand || it.aliases.contains(command)
                }

                if (subcmd != null) {
                    msg.reply {
                        title = "blep"
                    }
                } else {
                    msg.reply("Command **$command** existed but not subcommand **$subcommand**.")
                }
            } else {
                msg.reply("Command **$command** doesn't exist.")
            }
        } else {
            val command = handler.commands.values.firstOrNull {
                (it.name == arg || it.aliases.contains(arg)) && (it.category != CommandCategory.EASTER_EGG && it.category != CommandCategory.SYSTEM)
            }

            if (command != null) {
                msg.reply {
                    title = "blep"
                }
            } else {
                // Check if it is a module
                val module = handler.commands.values.filter {
                    it.category.key.lowercase() == arg.lowercase() && !listOf("system", "easter_egg").contains(arg.lowercase())
                }

                if (module.isNotEmpty()) {
                    val propLen = { name: String -> name.length }
                    val longestCommandName = propLen(module.sortedWith { a, b ->
                        propLen(b.name) - propLen(a.name)
                    }.first().name)

                    msg.reply {
                        title = "[ Module ${arg.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }} ]"
                        description = buildString {
                            for (c in module) {
                                val description = try {
                                    msg.locale.translate(c.description)
                                } catch (e: Exception) {
                                    "*not translated yet!*"
                                }

                                appendLine("`$prefix${c.name.padEnd((longestCommandName * 2) - c.name.length, '\u200b')}` |\u200b \u200b$description")
                            }
                        }
                    }
                } else {
                    msg.reply("Command or module **$arg** doesn't exist. :(")
                }
            }
        }
    }
}

/*
    private suspend fun renderCommandHelp(msg: CommandMessage) {
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
 */
