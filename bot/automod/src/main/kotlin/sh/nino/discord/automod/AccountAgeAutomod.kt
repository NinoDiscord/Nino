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

import dev.kord.core.Kord
import kotlinx.datetime.toJavaInstant
import org.koin.core.context.GlobalContext
import sh.nino.discord.automod.core.automod
import sh.nino.discord.common.extensions.retrieve
import sh.nino.discord.database.asyncTransaction
import sh.nino.discord.database.tables.AutomodEntity
import sh.nino.discord.database.tables.PunishmentType
import sh.nino.discord.punishments.MemberLike
import sh.nino.discord.punishments.PunishmentModule
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit

val accountAgeAutomod = automod {
    name = "accountAge"
    onMemberJoin { event ->
        val settings = asyncTransaction {
            AutomodEntity.findById(event.guild.id.value.toLong())!!
        }

        if (!settings.accountAge)
            return@onMemberJoin false

        val totalDays = ChronoUnit.DAYS.between(event.member.joinedAt.toJavaInstant(), OffsetDateTime.now().toLocalDate())
        if (totalDays <= settings.accountAgeDayThreshold) {
            val punishments = GlobalContext.retrieve<PunishmentModule>()
            val kord = GlobalContext.retrieve<Kord>()
            val guild = event.getGuild()
            val selfMember = guild.getMember(kord.selfId)

            punishments.apply(
                MemberLike(event.member, event.getGuild(), event.member.id),
                selfMember,
                PunishmentType.KICK
            ) {
                reason = "[Automod] Account threshold for member was under ${settings.accountAgeDayThreshold} days."
            }

            return@onMemberJoin true
        }

        false
    }
}
