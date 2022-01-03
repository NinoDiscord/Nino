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

package sh.nino.discord.api.commands

import dev.kord.common.entity.ApplicationCommandOption
import dev.kord.common.entity.Permissions

private val SLASH_COMMAND_NAME_REGEX = "^[\\w-]{1,32}\$".toRegex()

class SlashCommand(
    val name: String,
    val description: String,
    val options: List<ApplicationCommandOption>,
    val onlyIn: List<Long> = listOf(),
    val userPermissions: Permissions,
    val botPermissions: Permissions,
    val subcommands: List<SlashSubcommand>,
    val groups: List<SlashSubcommandGroup>,
    private val runner: suspend (SlashCommandMessage) -> Unit
) {
    init {
        check(name.matches(SLASH_COMMAND_NAME_REGEX)) { "owo da uwu" }
    }

    suspend fun execute(msg: SlashCommandMessage, callback: suspend (Exception?, Boolean) -> Unit) {
        try {
            runner.invoke(msg)
            callback(null, true)
        } catch (e: Exception) {
            callback(e, false)
        }
    }
}
