package sh.nino.discord.core.annotations

annotation class Subcommand(
    val name: String,
    val description: String,
    val usage: String = "",
    val permissions: LongArray = [],
    val aliases: Array<String> = []
)
