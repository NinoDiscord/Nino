package sh.nino.discord.core.annotations

import sh.nino.discord.core.command.CommandCategory

annotation class Command(
    val name: String,
    val description: String,
    val category: CommandCategory = CommandCategory.CORE,
    val usage: String = "",
    val ownerOnly: Boolean = false,
    val aliases: Array<String> = [],
    val examples: Array<String> = [],
    val cooldown: Int = 5,
    val userPermissions: IntArray = [],
    val botPermissions: IntArray = []
)
