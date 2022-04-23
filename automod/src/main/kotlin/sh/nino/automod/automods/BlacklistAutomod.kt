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

package sh.nino.automod.automods

import dev.kord.core.Kord
import org.koin.core.context.GlobalContext
import sh.nino.automod.automod
import sh.nino.commons.extensions.retrieve
import sh.nino.database.asyncTransaction
import sh.nino.database.entities.AutomodEntity
import sh.nino.modules.Registry
import sh.nino.modules.punishments.PunishmentModule

val BlacklistAutomod = automod {
    name = "blacklist"
    onMessage { event ->
        // TODO: Implement Registry#currentOrNull?
        val punishments = Registry.CURRENT!!.getOrNull<PunishmentModule>()!!.current
        val kord = GlobalContext.retrieve<Kord>()
        val guild = event.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        if (!settings.blacklist)
            return@onMessage false

        // TODO: is regex better for this?
        val content = event.message.content.split(" ")
        for (word in settings.blacklistedWords) {
            if (content.any { it.lowercase() == word.lowercase() }) {
                event.message.delete()
                event.message.channel.createMessage("Hey, **${event.message.author!!.tag}**! You're not allowed to say that... :<")

                punishments.addWarning(event.member!!, guild.getMember(kord.selfId), 1, "[Automod :: Blacklisted Words] User said blacklisted word in <#${event.message.channel.id}>.")
                return@onMessage true
            }
        }

        false
    }
}
