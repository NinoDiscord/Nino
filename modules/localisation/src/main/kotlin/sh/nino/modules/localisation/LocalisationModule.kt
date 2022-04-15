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

package sh.nino.modules.localisation

import gay.floof.utils.slf4j.logging
import kotlinx.serialization.json.Json
import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.ModuleMeta
import java.io.File

@ModuleMeta("localisation", "Implements localisation to Nino", version = "2.0.0")
class LocalisationModule(private val configDefaultLocale: String, private val json: Json) {
    private val localeDirectory = File("./locales")
    private lateinit var defaultLocale: Locale
    private val log by logging<LocalisationModule>()
    lateinit var locales: Map<String, Locale>

    @Action
    @Suppress("UNUSED")
    fun onInit() {
        log.info("Finding locales in ${localeDirectory.path}...")
        if (!localeDirectory.exists())
            throw IllegalStateException("Localisation path doesn't exist in '${localeDirectory.path}'!")

        val files = localeDirectory.listFiles { _, s -> s.endsWith(".json") } ?: arrayOf()
        val found = mutableMapOf<String, Locale>()

        for (file in files) {
            val locale = Locale.fromFile(file, json)
            log.info("Found language ${locale.meta.code} by ${locale.meta.translator}!")
            found[locale.meta.code] = locale

            if (locale.meta.code == configDefaultLocale) {
                log.info("Default language was set to $configDefaultLocale and it was found.")
                defaultLocale = locale
            }
        }

        if (!::defaultLocale.isInitialized) {
            log.warn("Couldn't find the language $configDefaultLocale, setting to English (US)!")
            defaultLocale = found["en_US"]!!
        }

        locales = found.toMap()
    }

    fun getLocale(guild: String, user: String): Locale {
        // This should never happen, but it could happen.
        if (!locales.containsKey(guild) || !locales.containsKey(user)) return defaultLocale

        // If both parties use the default locale, return it.
        if (guild == defaultLocale.meta.code && user == defaultLocale.meta.code) return defaultLocale

        // Users have more priority than guilds, so let's check if the guild locale
        // is the default and the user's locale is completely different
        if (user != defaultLocale.meta.code && guild == defaultLocale.meta.code) return locales[user]!!

        // If the user's locale is not the guild's locale, return it,
        // so it can be translated properly.
        if (guild !== defaultLocale.meta.code && user == defaultLocale.meta.code) return locales[guild]!!

        // We should never be here, but here we are.
        error("Illegal unknown value (locale: guild->$guild;user->$user)")
    }
}
