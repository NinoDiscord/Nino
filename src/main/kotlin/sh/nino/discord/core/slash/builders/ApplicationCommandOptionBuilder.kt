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
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

data class ApplicationCommandOption(
    val name: String,
    val description: String,
    val type: ApplicationCommandOptionType,
    val required: Boolean = false,
    val choices: List<NameValuePair>? = null,
    val options: List<ApplicationCommandOption>? = null
) {
    fun toRest() {
        // TODO: this
    }
}

data class NameValuePair(
    val name: String,
    val value: Any
)

/**
 * Represents a builder class to construct slash command options.
 */
class ApplicationCommandOptionBuilder {
    private val otherOptions: MutableList<ApplicationCommandOption> = mutableListOf()
    private val allChoices: MutableList<NameValuePair> = mutableListOf()

    lateinit var description: String
    lateinit var name: String
    var required: Boolean = false
    var type: ApplicationCommandOptionType = ApplicationCommandOptionType.Unknown(-1)

    fun choice(name: String, value: Any): ApplicationCommandOptionBuilder {
        allChoices.add(NameValuePair(name, value))
        return this
    }

    @OptIn(ExperimentalContracts::class)
    fun option(builder: ApplicationCommandOptionBuilder.() -> Unit): ApplicationCommandOptionBuilder {
        contract { callsInPlace(builder, InvocationKind.EXACTLY_ONCE) }

        val option = ApplicationCommandOptionBuilder().apply(builder).build()
        otherOptions.add(option)

        return this
    }

    fun build(): ApplicationCommandOption {
        require(this::name.isInitialized) { "`name` must be defined." }
        require(this::description.isInitialized) { "`description` must be defined." }
        require(this.type.type != -1) { "`type` cannot be unknown." }
        require(this.otherOptions.size < 25) { "Cannot have more than 25 options, went over ${this.otherOptions.size - 25} options." }

        return ApplicationCommandOption(
            name,
            description,
            type,
            required,
            if (allChoices.isNotEmpty()) allChoices.toList() else null,
            if (otherOptions.isNotEmpty()) otherOptions.toList() else null
        )
    }
}
