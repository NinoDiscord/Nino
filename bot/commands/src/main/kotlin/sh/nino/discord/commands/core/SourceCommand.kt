package sh.nino.discord.commands.core

import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command

@Command(
    "source",
    "descriptions.core.source",
    aliases = ["github", "code", "sauce"]
)
class SourceCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        msg.reply(":eyes: **Here you go ${msg.author.tag}**: <https://github.com/NinoDiscord/Nino>")
    }
}
