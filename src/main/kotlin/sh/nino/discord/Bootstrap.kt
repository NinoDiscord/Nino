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

package sh.nino.discord

import org.koin.core.context.GlobalContext
import org.koin.core.context.GlobalContext.startKoin
import org.koin.dsl.module
import sh.nino.discord.extensions.inject
import sh.nino.discord.kotlin.logging
import sh.nino.discord.utils.showBanner

object Bootstrap {
    private lateinit var bot: NinoBot
    private val logger by logging<Bootstrap>()

    init {
        // bot.addShutdownHook()
    }

    @JvmStatic
    fun main(args: Array<String>) {
        showBanner()
        logger.info("* Initializing Koin...")

        startKoin {
            modules(
                globalModule,
                module {
                    single {
                        NinoBot()
                    }
                }
            )
        }

        logger.info("* Initialized Koin, now starting Nino...")
        bot = GlobalContext.inject()
    }
}
