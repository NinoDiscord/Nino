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

package sh.nino.discord.core.command.subcommand

import dev.kord.common.entity.Permission
import sh.nino.discord.core.annotations.NinoDslMarker

/**
 * Represents a builder class for constructing subcommands.
 */
@NinoDslMarker
class SubcommandBuilder {
    /**
     * Returns the localized key for the subcommand's description
     */
    var description: String = ""

    /**
     * Returns a list of [Permission] objects that this [Subcommand] requires
     * before executing.
     */
    var permissions: MutableList<Permission> = mutableListOf()

    /**
     * Returns the aliases for this [Subcommand].
     */
    var aliases: MutableList<String> = mutableListOf()

    /**
     * Returns this [subcommand][Subcommand]'s name.
     */
    var name: String = ""

    /**
     * Executes this [Subcommand] object.
     */
    fun execute() {}

    fun build(): Subcommand = Subcommand()
}
