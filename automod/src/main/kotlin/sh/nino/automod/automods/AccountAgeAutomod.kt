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
import kotlinx.datetime.toJavaInstant
import org.koin.core.context.GlobalContext
import sh.nino.automod.automod
import sh.nino.commons.extensions.retrieve
import sh.nino.database.PunishmentType
import sh.nino.database.asyncTransaction
import sh.nino.database.entities.AutomodEntity
import sh.nino.modules.Registry
import sh.nino.modules.punishments.PunishmentModule
import sh.nino.modules.punishments.toMemberLikeObject
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit

val AccountAgeAutomod = automod {
    name = "accountAge"
    onMemberJoin { event ->
        // TODO: Implement Registry#currentOrNull?
        val punishments = Registry.CURRENT!!.getOrNull<PunishmentModule>()!!.current
        val kord = GlobalContext.retrieve<Kord>()

        val settings = asyncTransaction {
            AutomodEntity.findById(event.guildId.value.toLong())!!
        }

        // If it is disabled, do not continue
        if (!settings.accountAge) return@onMemberJoin false

        val total = ChronoUnit.DAYS.between(event.member.joinedAt.toJavaInstant(), OffsetDateTime.now().toLocalDate())
        if (total <= settings.accountAgeThreshold) {
            val guild = event.getGuild()
            val selfMember = guild.getMember(kord.selfId)

            punishments.apply(event.member.toMemberLikeObject(event.member.id, guild), selfMember, PunishmentType.KICK) {
                reason = "[Automod :: Account Age] Join date threshold was under ${settings.accountAgeThreshold} days."
            }

            return@onMemberJoin true
        }

        false
    }
}
