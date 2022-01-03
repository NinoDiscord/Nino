package sh.nino.discord.api.annotations

/**
 * Represents the declaration of a slash command with some metadata.
 * @param name The name of the slash command, must be 1-32 characters.
 * @param description The description of the slash command, must be 1-100 characters.
 * @param onlyIn Guild IDs where this slash command will be registered in.
 * @param userPermissions Bitwise values of the required permissions for the executor.
 * @param botPermissions Bitwise values of the required permissions for the bot.
 */
annotation class SlashCommand(
    val name: String,
    val description: String,
    val onlyIn: LongArray = [],
    val userPermissions: LongArray = [],
    val botPermissions: LongArray = []
)
