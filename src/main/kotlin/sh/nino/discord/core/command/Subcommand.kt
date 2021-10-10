package sh.nino.discord.core.command

class Subcommand(
    val name: String,
    val description: String,
    val usage: String = "",
    val aliases: List<String> = listOf()
)
