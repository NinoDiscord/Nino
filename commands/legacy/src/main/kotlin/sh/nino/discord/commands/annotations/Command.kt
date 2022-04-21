/*
 * 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
 * Copyright (c) 2019-2022 Nino Team
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

package sh.nino.discord.commands.annotations

import sh.nino.discord.commands.CommandCategory

/**
 * Represents the metadata of a legacy-based command.
 * @param name The name of the command, this cannot be over 32 characters.
 * @param description This must be the path to the localisation of the description itself.
 * @param aliases A list of aliases that the command can be executed with; same rules apply with the [name] attribute.
 * @param examples A list of examples that is shown with the `--help`/`-h` flags or when invoked with the `help` command.
 *                 This uses the templating language to support items like `{prefix}` and `{name}` in the examples.
 *
 * @param category The [category][CommandCategory] this command belongs to.
 * @param cooldown The cooldown of the command in seconds, later, it will support custom bucket types (i.e, guild, channel)
 *                 and possibly use Redis as a "cache?"
 *
 * @param ownerOnly If true, only the owners of the bot (defined under the `owners` config variable) can execute this command.
 * @param userPermissions A list of permissions that the user needs to execute this command. Due to constraints with Kotlin,
 *                        this has to be with the `Long` data type instead of Kord's `Permission` class due to annotations
 *                        being processed at compile time and not at runtime where it can be evaluated.
 *
 * @param botPermissions A list of permissions that Nino requires to execute this command. Read the KDoc on the [userPermissions]
 *                       attribute on why it is an [LongArray] and not an array of `Permission` objects.
 */
annotation class Command(
    val name: String,
    val description: String,
    val aliases: Array<String> = [],
    val examples: Array<String> = [],
    val category: CommandCategory = CommandCategory.CORE,
    val cooldown: Int = 5,
    val ownerOnly: Boolean = false,
    val userPermissions: LongArray = [],
    val botPermissions: LongArray = [],
)
