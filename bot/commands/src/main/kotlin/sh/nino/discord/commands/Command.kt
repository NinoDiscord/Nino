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

package sh.nino.discord.commands

import dev.kord.common.DiscordBitSet
import dev.kord.common.entity.Permissions

class Command private constructor(
    val name: String,
    val description: String,
    val category: CommandCategory = CommandCategory.CORE,
    val usage: String = "",
    val ownerOnly: Boolean = false,
    val aliases: List<String> = listOf(),
    val examples: List<String> = listOf(),
    val cooldown: Int = 5,
    val userPermissions: Permissions = Permissions(),
    val botPermissions: Permissions = Permissions(),
    val thiz: AbstractCommand
) {
    constructor(thiz: AbstractCommand): this(
        thiz.info.name,
        thiz.info.description,
        thiz.info.category,
        thiz.info.usage,
        thiz.info.ownerOnly,
        thiz.info.aliases.toList(),
        thiz.info.examples.toList(),
        thiz.info.cooldown,
        Permissions(DiscordBitSet(thiz.info.userPermissions)),
        Permissions(DiscordBitSet(thiz.info.botPermissions)),
        thiz
    )

    suspend fun run(msg: CommandMessage, callback: suspend (Exception?, Boolean) -> Unit) {
        try {
            thiz.execute(msg)
            callback(null, true)
        } catch (e: Exception) {
            callback(e, false)
        }
    }
}
