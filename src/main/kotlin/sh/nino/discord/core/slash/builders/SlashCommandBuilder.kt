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

package sh.nino.discord.core.slash.builders

import dev.kord.common.entity.Permission
import dev.kord.common.entity.Permissions
import sh.nino.discord.core.command.CommandCategory
import sh.nino.discord.core.slash.SlashCommand
import sh.nino.discord.core.slash.SlashCommandMessage
import sh.nino.discord.core.slash.SlashSubcommand
import sh.nino.discord.core.slash.SlashSubcommandGroup
import java.lang.IllegalStateException
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun slashCommand(block: SlashCommandBuilder.() -> Unit): SlashCommand {
    contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }
    return SlashCommandBuilder().apply(block).build()
}

/**
 * Represents a slash command builder, for contructing slash commands.
 */
class SlashCommandBuilder {
    private val userPermissions: MutableList<Permission> = mutableListOf()
    private val botPermissions: MutableList<Permission> = mutableListOf()
    private val commandOptions: MutableList<ApplicationCommandOption> = mutableListOf()
    private val subcommands: MutableList<SlashSubcommand> = mutableListOf()
    private val subcommandGroups: MutableList<SlashSubcommandGroup> = mutableListOf()
    private val onlyInGuilds: MutableList<Long> = mutableListOf()
    private var executor: (suspend (SlashCommandMessage) -> Unit)? = null

    lateinit var description: String
    lateinit var name: String

    var category: CommandCategory = CommandCategory.CORE
    var cooldown = 5

    fun bulkAddOptions(options: List<ApplicationCommandOption>): SlashCommandBuilder {
        commandOptions += options
        return this
    }

    @OptIn(ExperimentalContracts::class)
    fun option(block: ApplicationCommandOptionBuilder.() -> Unit): SlashCommandBuilder {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }

        val option = ApplicationCommandOptionBuilder().apply(block).build()
        commandOptions.add(option)

        return this
    }

    fun onlyIn(vararg guilds: Long): SlashCommandBuilder {
        for (guild in guilds) {
            onlyInGuilds.add(guild)
        }

        return this
    }

    fun run(msg: suspend (SlashCommandMessage) -> Unit): SlashCommandBuilder {
        if (executor != null) throw IllegalStateException("`executor` is already defined.")

        executor = msg
        return this
    }

    fun requiresUser(vararg permission: Permission): SlashCommandBuilder {
        for (perm in permission) userPermissions.add(perm)
        return this
    }

    fun requiresSelf(vararg permission: Permission): SlashCommandBuilder {
        for (perm in permission) botPermissions.add(perm)
        return this
    }

    @OptIn(ExperimentalContracts::class)
    fun subcommand(name: String, description: String, block: SlashSubcommandBuilder.() -> Unit): SlashCommandBuilder {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }

        val subcommand = SlashSubcommandBuilder(name, description).apply(block).build(this)
        subcommands.add(subcommand)
        return this
    }

    @OptIn(ExperimentalContracts::class)
    fun subcommandGroup(name: String, description: String, block: SlashSubcommandGroupBuilder.() -> Unit): SlashCommandBuilder {
        contract { callsInPlace(block, InvocationKind.EXACTLY_ONCE) }

        val group = SlashSubcommandGroupBuilder(name, description, this).apply(block).build()
        subcommandGroups.add(group)

        return this
    }

    fun build(): SlashCommand {
        require(this::description.isInitialized) { "`description` must be defined." }
        require(this::name.isInitialized) { "`name` must be defined." }
        require(commandOptions.size < 25) { "`options` cannot be over 25 options." }
        require(executor != null) { "Missing runner function. Call `run {}` DSL block." }

        return SlashCommand(
            name,
            description,
            category,
            cooldown,
            commandOptions,
            onlyInGuilds,
            Permissions {
                for (permission in userPermissions) {
                    +permission
                }
            },

            Permissions {
                for (permission in botPermissions) {
                    +permission
                }
            },

            subcommands,
            subcommandGroups,
            executor!!
        )
    }
}
