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

package sh.nino.discord.core.command

import dev.kord.common.entity.Permissions
import kotlinx.coroutines.launch
import sh.nino.discord.core.NinoScope
import kotlin.reflect.KCallable
import kotlin.reflect.full.callSuspend
import sh.nino.discord.core.annotations.Command as CommandAnnotation

class Command(
    val name: String,
    val description: String,
    val category: CommandCategory = CommandCategory.CORE,
    val usage: String = "",
    val ownerOnly: Boolean = false,
    val aliases: List<String> = listOf(),
    val examples: List<String> = listOf(),
    val cooldown: Int = 5,
    val userPermissions: List<Permissions> = listOf(),
    val botPermissions: List<Permissions> = listOf(),
    private val thisCtx: Any,
    private val kMethod: KCallable<Unit>
) {
    constructor(
        info: CommandAnnotation,
        cmdKlass: Any,
        method: KCallable<Unit>
    ): this(
        info.name,
        info.description,
        info.category,
        info.usage,
        info.ownerOnly,
        info.aliases.toList(),
        info.examples.toList(),
        info.cooldown,
        info.userPermissions.map { p -> Permissions { +p } }.toList(),
        info.botPermissions.map { p -> Permissions { +p } }.toList(),
        cmdKlass,
        method
    )

    suspend fun execute(callback: (Boolean, Exception?) -> Unit) {
        if (kMethod.isSuspend) {
            NinoScope.launch {
                try {
                    kMethod.callSuspend(thisCtx)
                    callback(true, null)
                } catch (e: Exception) {
                    callback(false, e)
                }
            }
        } else {
            try {
                kMethod.call(thisCtx)
                callback(true, null)
            } catch (e: Exception) {
                callback(false, e)
            }
        }
    }
}
