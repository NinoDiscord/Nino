package sh.nino.discord.core.command.subcommand

import dev.kord.common.entity.Permission
import sh.nino.discord.core.annotations.NinoDslMarker

/**
 * Represents a builder class for constructing subcommands.
 */
@NinoDslMarker
class SubcommandBuilder {
    /**
     * Returns the localized key for the subcommand's description
     */
    var description: String = ""

    /**
     * Returns a list of [Permission] objects that this [Subcommand] requires
     * before executing.
     */
    var permissions: MutableList<Permission> = mutableListOf()

    /**
     * Returns the aliases for this [Subcommand].
     */
    var aliases: MutableList<String> = mutableListOf()

    /**
     * Returns this [subcommand][Subcommand]'s name.
     */
    var name: String = ""

    /**
     * Executes this [Subcommand] object.
     */
    fun execute() {}

    fun build(): Subcommand = Subcommand()
}
