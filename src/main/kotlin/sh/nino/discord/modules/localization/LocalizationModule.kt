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

package sh.nino.discord.modules.localization

import sh.nino.discord.data.Config
import sh.nino.discord.kotlin.logging
import java.io.File

class LocalizationModule(config: Config) {
    private val localeDirectory: File = File("./locales")
    private lateinit var defaultLocale: Locale
    private val logger by logging<LocalizationModule>()
    private val locales: MutableMap<String, Locale> = mutableMapOf()

    init {
        logger.info("Now locating locales in ${localeDirectory.path}")
        if (!localeDirectory.exists())
            throw IllegalStateException("Locale path must be available under ${localeDirectory.path}.")

        val files = localeDirectory.listFiles { _, s ->
            s.endsWith(".json")
        } ?: arrayOf()

        for (file in files) {
            val locale = Locale.fromFile(file)

            logger.info("Found locale ${locale.meta.code} by ${locale.meta.translator}!")
            locales[locale.meta.code] = locale

            if (locale.meta.code == config.defaultLocale) {
                logger.info("Found default locale ${config.defaultLocale}!")
                defaultLocale = locale
            }
        }

        if (!this::defaultLocale.isInitialized) {
            logger.warn("No default locale was found, setting to English (US)!")
            defaultLocale = locales["en_US"]!!
        }
    }

    fun get(guild: String, user: String): Locale {
        // This should never happen, but it could happen.
        if (!locales.containsKey(guild) || !locales.containsKey(user)) return defaultLocale

        // If both parties use the default locale, return it.
        if (guild == defaultLocale.meta.code && user == defaultLocale.meta.code) return defaultLocale

        // Users have more priority than guilds, so let's check if the guild locale
        // is the default and the user's locale is completely different
        if (user != defaultLocale.meta.code && guild == defaultLocale.meta.code) return locales[user]!!

        // If the user's locale is not the guild's locale, return it
        // so it can be translated properly.
        if (guild !== defaultLocale.meta.code && user == defaultLocale.meta.code) return locales[guild]!!

        // We should never be here, but here we are.
        error("Illegal unknown value (locale: guild->$guild;user->$user)")
    }
}
