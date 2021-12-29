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

package sh.nino.discord.punishments.impl

import dev.kord.core.Kord
import dev.kord.core.cache.data.MemberData
import dev.kord.core.cache.data.toData
import dev.kord.core.entity.Member
import dev.kord.core.entity.Message
import gay.floof.utils.slf4j.logging
import kotlinx.datetime.Clock
import org.koin.core.context.GlobalContext
import sh.nino.discord.punishments.MemberLike
import sh.nino.discord.punishments.PunishmentModule
import sh.nino.discord.punishments.PunishmentType
import sh.nino.discord.punishments.builder.ApplyPunishmentBuilder
import sh.nino.discord.punishments.builder.PublishModLogBuilder

class PunishmentModuleImpl: PunishmentModule {
    private val logger by logging<PunishmentModuleImpl>()
    private val kord: Kord by lazy {
        GlobalContext.get().get()
    }

    /**
     * Resolves the current [member] to get the actual member object IF the current
     * [member] object is a partial member instance.
     */
    override suspend fun resolveMember(member: MemberLike, useRest: Boolean): Member {
        if (!member.partial) return member.member!!

        // If it is cached in Kord, let's return it
        val cachedMember = kord.defaultSupplier.getMemberOrNull(member.guild.id, member.id)
        if (cachedMember != null) return cachedMember

        // If not, let's retrieve it from REST
        // the parameter is a bit misleading though...
        return if (useRest) {
            val rawMember = kord.rest.guild.getGuildMember(member.guild.id, member.id)
            Member(rawMember.toData(member.guild.id, member.id), rawMember.user.value!!.toData(), kord)
        } else {
            val user = kord.rest.user.getUser(member.id)
            Member(
                // we're mocking this because we have no information
                // about the member, so.
                MemberData(
                    member.id,
                    member.guild.id,
                    joinedAt = Clock.System.now().toString(),
                    roles = listOf()
                ),

                user.toData(),
                kord
            )
        }
    }

    /**
     * Adds a warning to the [member].
     * @param member The member to add warnings towards.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the [member] needs to be warned.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just add the amount of warnings from the [member] in the guild by 1.
     */
    override suspend fun addWarning(member: Member, moderator: Member, reason: String?, amount: Int) {
        TODO("Not yet implemented")
    }

    /**
     * Removes any warnings from the [member].
     *
     * @param member The member that needs their warnings removed.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the warnings were removed.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just clean their database entries for this specific guild, not globally.
     *
     * @throws IllegalStateException If the member doesn't need any warnings removed.
     */
    override suspend fun removeWarning(member: Member, moderator: Member, reason: String?, amount: Int?) {
        TODO("Not yet implemented")
    }

    /**
     * Applies a new punishment to a user, if needed.
     * @param member The [member][MemberLike] to execute this action.
     * @param moderator The moderator who executed this action.
     * @param type The punishment type that is being executed.
     * @param builder DSL builder for any extra options.
     */
    override suspend fun apply(
        member: MemberLike,
        moderator: Member,
        type: PunishmentType,
        builder: ApplyPunishmentBuilder.() -> Unit
    ) {
        TODO("Not yet implemented")
    }

    /**
     * Publishes the [case] towards the mod-log channel if specified
     * in guild settings.
     *
     * @param case The case
     */
    override suspend fun publishModlog(case: Any, builder: PublishModLogBuilder.() -> Unit) {
        TODO("Not yet implemented")
    }

    override suspend fun editModlogMessage(case: Any, message: Message) {
        TODO("Not yet implemented")
    }
}
