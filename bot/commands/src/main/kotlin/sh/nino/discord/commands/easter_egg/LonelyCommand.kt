package sh.nino.discord.commands.easter_egg

import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command

@Command(
    "lonely",
    "I wonder what this could be? I don't really know myself...",
    aliases = ["owo", "lone", ":eyes:"]
)
class LonelyCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        msg.replyTranslate("generic.lonely")
    }
}
