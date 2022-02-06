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

package sh.nino.discord.automod

import org.koin.core.context.GlobalContext
import sh.nino.discord.automod.core.automod
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.AutomodEntity
import sh.nino.discord.punishments.PunishmentModule

val blacklistAutomod = automod {
    name = "blacklist"
    onMessage { event ->
        val guild = event.message.getGuild()
        val settings = asyncTransaction {
            AutomodEntity.findById(guild.id.value.toLong())!!
        }

        if (!settings.blacklist)
            return@onMessage false

        val content = event.message.content.split(" ")
        for (word in settings.blacklistedWords) {
            if (content.any { it.lowercase() == word.lowercase() }) {
                event.message.delete()
                event.message.channel.createMessage("Hey! You are not allowed to say that here! qwq")

                val punishments = GlobalContext.retrieve<PunishmentModule>()
                punishments.addWarning(event.member!!, guild.getMember(event.kord.selfId), "[Automod] User said a blacklisted word in their message. qwq")

                return@onMessage true
            }
        }

        false
    }
}
