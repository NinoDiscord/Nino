/*
 * Copyright (c) 2019-2022 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
