package sh.nino.discord.commands.annotations

import sh.nino.discord.commands.CommandCategory

annotation class Command(
    val name: String,
    val description: String = "descriptions.unknown",
    val usage: String = "",
    val category: CommandCategory = CommandCategory.CORE,
    val cooldown: Int = 5,
    val ownerOnly: Boolean = false,
    val userPermissions: LongArray = [],
    val botPermissions: LongArray = [],
    val examples: Array<String> = [],
    val aliases: Array<String> = []
)
