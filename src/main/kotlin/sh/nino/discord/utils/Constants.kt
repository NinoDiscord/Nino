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

package sh.nino.discord.utils

import sh.nino.discord.extensions.asKordColor
import java.awt.Color
import java.util.regex.Pattern

object Constants {
    /**
     * Returns a [Color][dev.kord.common.Color] object for embeds
     */
    val COLOR: dev.kord.common.Color = Color.decode("#D26DB1").asKordColor()

    val USERNAME_DISCRIM_REGEX = Pattern.compile("^(\\w.+)#(\\d{4})\$")
    val DISCORD_INVITE_REGEX = Pattern.compile("(http(s)?://(www.)?)?(discord.gg|discord.io|discord.me|discord.link|invite.gg)/\\w+")
    val USER_MENTION_REGEX = Pattern.compile("^<@!?([0-9]+)>$")
    val CHANNEL_REGEX = Pattern.compile("<#([0-9]+)>$")
    val QUOTES_REGEX = Pattern.compile("['\"]")
    val ID_REGEX = Pattern.compile("^\\d+\$")
}
