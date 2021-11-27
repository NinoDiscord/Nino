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
import sh.nino.discord.core.slash.SlashCommandMessage
import sh.nino.discord.core.slash.SlashSubcommand
import java.lang.IllegalStateException
import kotlin.contracts.ExperimentalContracts

class SlashSubcommandBuilder(val name: String, val description: String) {
    private val commandOptions: MutableList<ApplicationCommandOption> = mutableListOf()
    private var executor: (suspend (SlashCommandMessage) -> Unit)? = null

    var required: Boolean = false

    @OptIn(ExperimentalContracts::class)
    fun option(option: ApplicationCommandOptionBuilder.() -> Unit): SlashSubcommandBuilder {
        commandOptions.add(ApplicationCommandOptionBuilder().apply(option).build())
        return this
    }

    fun run(msg: suspend (SlashCommandMessage) -> Unit): SlashSubcommandBuilder {
        if (executor != null) throw IllegalStateException("executor is already created.")

        executor = msg
        return this
    }

    fun build(parent: SlashCommandBuilder): SlashSubcommand {
        require(commandOptions.size < 25) { "No more than 25 options can be present." }
        require(executor != null) { "Executor cannot be null." }

        // add the subcommand declaration our self
        parent.option {
            this.description = this@SlashSubcommandBuilder.description
            this.required = false
            this.type = ApplicationCommandOptionType.SubCommand
            this.name = this@SlashSubcommandBuilder.name

            parent.bulkAddOptions(commandOptions.toList())
        }

        return SlashSubcommand(name, description, commandOptions.toList(), required, executor!!)
    }
}
