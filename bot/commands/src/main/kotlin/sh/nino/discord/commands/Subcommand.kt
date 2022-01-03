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

package sh.nino.discord.commands

import dev.kord.common.DiscordBitSet
import dev.kord.common.entity.Permissions
import kotlinx.coroutines.launch
import sh.nino.discord.core.NinoScope
import kotlin.reflect.KCallable
import kotlin.reflect.full.callSuspend
import sh.nino.discord.commands.annotations.Subcommand as Annotation

class Subcommand private constructor(
    val name: String,
    val description: String,
    val usage: String = "",
    val aliases: List<String> = listOf(),
    val permissions: Permissions = Permissions(),
    private val method: KCallable<*>,
    private val thisCtx: Any
) {
    constructor(
        method: KCallable<*>,
        info: Annotation,
        thisCtx: Any
    ): this(
        info.name,
        info.description,
        info.usage,
        info.aliases.toList(),
        Permissions(DiscordBitSet(info.permissions)),
        method,
        thisCtx
    )

    suspend fun execute(msg: CommandMessage, callback: suspend (Exception?, Boolean) -> Unit): Any =
        if (method.isSuspend) {
            NinoScope.launch {
                try {
                    method.callSuspend(thisCtx, msg)
                    callback(null, true)
                } catch (e: Exception) {
                    callback(e, false)
                }
            }
        } else {
            try {
                method.call(thisCtx, msg)
                callback(null, true)
            } catch (e: Exception) {
                callback(e, false)
            }
        }
}
