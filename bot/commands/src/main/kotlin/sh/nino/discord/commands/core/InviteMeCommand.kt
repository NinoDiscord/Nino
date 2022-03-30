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

package sh.nino.discord.commands.core

import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command

@Command(
    "invite",
    "descriptions.core.invite",
    aliases = ["inviteme", "i"]
)
class InviteMeCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        msg.reply(
            buildString {
                appendLine(":wave: Hello, **${msg.author.tag}**! Thanks for considering inviting me, you can invite")
                appendLine("me using the \"Add Server\" button when you click my profile or you can use the link below:")
                appendLine("**<https://discord.com/oauth2/authorize?client_id=${msg.kord.selfId}&scope=bot+applications.commands>**")
                appendLine()
                appendLine(":question: Need any help when using my moderation features? You can read the FAQ at **<https://nino.sh/faq>**")
                appendLine("or you can directly ask in the **Noelware** Discord server:")
                appendLine("https://discord.gg/ATmjFH9kMH")
            }
        )
    }
}
