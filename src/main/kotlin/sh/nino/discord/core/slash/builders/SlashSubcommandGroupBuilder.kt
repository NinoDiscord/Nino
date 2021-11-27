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

package sh.nino.discord.core.slash.builders

import dev.kord.common.entity.ApplicationCommandOptionType
import sh.nino.discord.core.slash.SlashSubcommand
import sh.nino.discord.core.slash.SlashSubcommandGroup
import kotlin.contracts.ExperimentalContracts

class SlashSubcommandGroupBuilder(val name: String, val description: String, private val parent: SlashCommandBuilder) {
    private val subcommands: MutableList<SlashSubcommand> = mutableListOf()
    var required: Boolean = false

    @OptIn(ExperimentalContracts::class)
    fun subcommand(name: String, description: String, block: SlashSubcommandBuilder.() -> Unit): SlashSubcommandGroupBuilder {
        val subcommand = SlashSubcommandBuilder(name, description).apply(block).build(parent)
        subcommands.add(subcommand)

        return this
    }

    fun build(): SlashSubcommandGroup {
        // add the subcommand declaration our self
        parent.option {
            this.description = this@SlashSubcommandGroupBuilder.description
            this.required = false
            this.type = ApplicationCommandOptionType.SubCommandGroup
            this.name = this@SlashSubcommandGroupBuilder.name

            for (command in subcommands) {
                option {
                    this.description = command.description
                    this.required = command.required
                    this.type = ApplicationCommandOptionType.SubCommand
                    this.name = command.name

                    parent.bulkAddOptions(command.options)
                }
            }
        }

        return SlashSubcommandGroup(name, description, required, subcommands.toList())
    }
}
