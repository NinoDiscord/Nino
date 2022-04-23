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

package sh.nino.commons

import sh.nino.commons.extensions.asKordColor
import java.awt.Color

/**
 * Represents constant variables throughout Nino subprojects.
 */
object Constants {
    /**
     * Returns the dedicated node from the JVM property `winterfox.dediNode`, from the
     * environment variable: `WINTERFOX_DEDI_NODE`, or null if none were found.
     */
    val dediNode by lazy {
        // Check if we have a system property of `winterfox.dediNode`,
        // if we do, let's just use it.
        val node1 = System.getProperty("winterfox.dediNode", "")!!
        if (node1.isNotEmpty()) return@lazy node1

        // Is it in the system environment variables?
        val node2 = try {
            System.getenv("WINTERFOX_DEDI_NODE")
        } catch (e: NullPointerException) {
            null
        }

        if (node2 != null) return@lazy node2
        null
    }

    val COLOR = Color.decode("#ff69bd").asKordColor()
    val UserDiscrimRegex = "^(\\w.+)#(\\d{4})$".toRegex()
    val DiscordInviteRegex = "(http(s)?://(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg)/\\w+".toRegex()
    val UserMentionRegex = "^<@!?([0-9]+)>$".toRegex()
    val ChannelMentionRegex = "<#([0-9]+)>$".toRegex()
    val QuoteRegex = "['\"]".toRegex()
    val IdRegex = "^\\d+$".toRegex()
    val FlagRegex = "(?:--?|—)([\\w]+)(=?(\\w+|['\"].*['\"]))?".toRegex(RegexOption.IGNORE_CASE)
}
