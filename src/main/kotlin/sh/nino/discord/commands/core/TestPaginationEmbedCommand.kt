/**
 * Copyright (c) 2019-2021 Nino
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

package sh.nino.discord.commands.core

import dev.kord.rest.builder.message.EmbedBuilder
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage
import sh.nino.discord.utils.Constants

@Command(
    name = "test",
    description = "Tests the pagination embed.",
    ownerOnly = true
)
class TestPaginationEmbedCommand: AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        msg.createPaginationEmbed(
            listOf(
                EmbedBuilder().apply {
                    color = Constants.COLOR
                    description = "boys ${"<:lovePlead:855278284089851945> ".repeat(20)}"
                },

                EmbedBuilder().apply {
                    color = Constants.COLOR
                    description = "ice is adorable indeed!"
                },

                EmbedBuilder().apply {
                    color = Constants.COLOR
                    description = "noel is not adorable. why speak such lies?"
                }
            )
        ).create()
    }
}
