package sh.nino.discord.slash.commands.annotations

/**
 * Represents a slash subcommand that is registered to an [AbstractSlashCommand][sh.nino.discord.slash.commands.AbstractSlashCommand].
 * If this subcommand should belong in a group, refer the [groupId] to chain it to that slash command.
 *
 * @param name The subcommand's name. Must be 1-32 characters.
 * @param description The subcommand's description. Must be 1-100 characters.
 * @param groupId An optional subcommand group to chain this subcommand to that group.
 *
 * ## Example
 * ```kt
 * @SlashCommandInfo("uwu", "uwu command!!!!")
 * class MySlashCommand: AbstractSlashCommand() {
 *    @Subcommand("owo", "Owos x amount of times.")
 *    suspend fun owo(
 *      msg: SlashSubcommandMessage,
 *      @Option("amount", "how many times to owo", type = Int::class) amount: Int
 *    ) {
 *      msg.reply("owo ".repeat(amount))
 *    }
 *
 *    // /uwu owo <amount: Int> will be registered to Discord.
 * }
 * ```
 */
annotation class Subcommand(
    val name: String,
    val description: String,
    val groupId: String = ""
)
