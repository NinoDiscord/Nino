package sh.nino.discord.commands

import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.core.command.arguments.Arg

@Command(
    name = "test",
    description = "A dumb test command."
)
class TestCommand: AbstractCommand() {
    suspend fun run(
        msg: CommandMessage,
        @Arg(name = "chose", type = String::class, optional = true) chose: String? = null
    ) = msg.reply("You chose **${chose ?: "owo"}**!")
}
