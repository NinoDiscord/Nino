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

package sh.nino.automod

import dev.kord.core.event.Event
import sh.nino.automod.automods.AccountAgeAutomod
import sh.nino.automod.automods.BlacklistAutomod
import sh.nino.automod.automods.MentionsAutomod
import sh.nino.automod.automods.MessageLinksAutomod

/**
 * Represents the global container for the auto moderation objects.
 */
class Container {
    private val automods = listOf(
        AccountAgeAutomod,
        BlacklistAutomod,
        MentionsAutomod,
        MessageLinksAutomod
    )

    suspend fun run(event: Event): Boolean {
        var ret = true
        for (automod in automods) {
            try {
                ret = automod.execute(event)
                if (ret) break
            } catch (e: Exception) {
                continue
            }
        }

        return ret
    }
}
