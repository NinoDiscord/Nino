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

@file:JvmName("NinoSlashCommandOptionsKt")
package sh.nino.discord.slash.commands

import dev.kord.common.entity.ApplicationCommandOptionType
import kotlin.reflect.KClass

interface CommandOptionType {
    val nullable: Boolean

    abstract class Nullable: CommandOptionType {
        override val nullable: Boolean = true
    }

    interface NullableObject {
        fun toNull(): Nullable
    }

    object String: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalString
    }

    object OptionalString: Nullable()

    object Integer: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalInt
    }

    object OptionalInt: Nullable()

    object Number: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalNumber
    }

    object OptionalNumber: Nullable()

    object Bool: CommandOptionType, NullableObject {
        override val nullable: Boolean = true
        override fun toNull(): Nullable = OptionalBool
    }

    object OptionalBool: Nullable()

    object User: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalUser
    }

    object OptionalUser: Nullable()

    object Channel: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalChannel
    }

    object OptionalChannel: Nullable()

    object Mentionable: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalMentionable
    }

    object OptionalMentionable: Nullable()

    object Role: CommandOptionType, NullableObject {
        override val nullable: Boolean = false
        override fun toNull(): Nullable = OptionalRole
    }

    object OptionalRole: Nullable()
}

fun CommandOptionType.asKordType(): ApplicationCommandOptionType = when (this) {
    is CommandOptionType.String, CommandOptionType.OptionalString -> ApplicationCommandOptionType.String
    is CommandOptionType.Integer, CommandOptionType.OptionalInt -> ApplicationCommandOptionType.Integer
    is CommandOptionType.Number, CommandOptionType.OptionalNumber -> ApplicationCommandOptionType.Number
    is CommandOptionType.Bool, CommandOptionType.OptionalBool -> ApplicationCommandOptionType.Boolean
    is CommandOptionType.User, CommandOptionType.OptionalUser -> ApplicationCommandOptionType.User
    is CommandOptionType.Channel, CommandOptionType.OptionalChannel -> ApplicationCommandOptionType.Channel
    is CommandOptionType.Mentionable, CommandOptionType.OptionalMentionable -> ApplicationCommandOptionType.Mentionable
    is CommandOptionType.Role, CommandOptionType.OptionalRole -> ApplicationCommandOptionType.Role
    else -> error("Unknown option type ${this::class}")
}

class CommandOption<T>(
    val name: String,
    val description: String,
    val type: CommandOptionType,
    val typeClass: KClass<*>,
    val choices: List<Pair<String, T>>? = null,
    val required: Boolean = true
)

class CommandOptionBuilder<T>(
    val name: String,
    val description: String,
    val type: CommandOptionType,
    var choices: MutableList<Pair<String, T>>? = null,
    var required: Boolean = true
) {
    fun optional(): CommandOptionBuilder<T> {
        required = false
        return this
    }

    fun choice(name: String, value: T): CommandOptionBuilder<T> {
        if (choices == null)
            choices = mutableListOf()

        choices!!.add(Pair(name, value))
        return this
    }
}

class CommandOptions {
    companion object {
        val None: CommandOptions = CommandOptions()
    }

    val args = mutableListOf<CommandOption<*>>()
    private inline fun <reified T> asBuilder(name: String, description: String, type: CommandOptionType): CommandOptionBuilder<T> = CommandOptionBuilder(
        name,
        description,
        type
    )

    inline fun <reified T> CommandOptionBuilder<T>.register(): CommandOption<T> {
        if (args.any { it.name == this.name })
            throw IllegalStateException("Command option $name already exists.")

        val option = CommandOption(
            this.name,
            this.description,
            this.type,
            T::class,
            this.choices ?: listOf(),
            this.required
        )

        args.add(option)
        return option
    }

    fun string(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.String
    )

    fun bool(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Bool
    )

    fun number(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Number
    )

    fun integer(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Integer
    )

    fun user(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.User
    )

    fun role(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Role
    )

    fun channel(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Channel
    )

    fun mentionable(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.Mentionable
    )

    fun optionalString(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalString
    )

    fun optionalBool(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalBool
    )

    fun optionalNumber(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalNumber
    )

    fun optionalInt(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalInt
    )

    fun optionalUser(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalUser
    )

    fun optionalRole(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalRole
    )

    fun optionalChannel(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalChannel
    )

    fun optionalMentionable(name: String, description: String): CommandOptionBuilder<String> = asBuilder(
        name,
        description,
        CommandOptionType.OptionalMentionable
    )
}
