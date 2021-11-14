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

package sh.nino.discord.commands.core

import dev.kord.core.Kord
import sh.nino.discord.core.annotations.Command
import sh.nino.discord.core.command.AbstractCommand
import sh.nino.discord.core.command.CommandMessage

@Command(
    name = "invite",
    description = "descriptions.core.invite",
    aliases = ["inviteme", "botinvite", "inv"],
    examples = ["{prefix}invite"]
)
class InviteCommand(private val kord: Kord): AbstractCommand() {
    override suspend fun run(msg: CommandMessage) {
        msg.reply(
            """
            Hello, **${msg.author.tag}**! It seems that you want to invite me, splendid!
            You can do so by clicking this URL: **<https://discord.com/oauth2/authorize?client_id=${kord.selfId.asString}&scope=bot+applications.commands>**

            You can invite my other counterpart if you wish to use cutting edge technology:tm:!
            Though, I do have to warn you that it can be very buggy!
            **<https://discord.com/oauth2/authorize?client_id=613907896622907425&scope=bot>**

            :question: Need support on something you don't understand? You can always join
            the **Noelware** Discord server in which you can get full support of me, and me only! :smiley:
            https://discord.gg/ATmjFH9kMH

            Thanks on listening, now I got to tune out... :<
            """.trimIndent()
        )
    }
}
