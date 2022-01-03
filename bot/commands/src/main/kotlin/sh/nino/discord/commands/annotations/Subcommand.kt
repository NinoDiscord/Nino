package sh.nino.discord.commands.annotations

annotation class Subcommand(
    val name: String,
    val description: String,
    val usage: String = "",
    val aliases: Array<String> = [],
    val permissions: LongArray = []
)
