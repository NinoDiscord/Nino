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

package sh.nino.discord.punishments

import dev.kord.core.entity.Member
import dev.kord.core.entity.Message
import kotlinx.datetime.LocalDateTime
import sh.nino.discord.database.tables.GuildCasesEntity
import sh.nino.discord.database.tables.PunishmentType
import sh.nino.discord.punishments.builder.ApplyPunishmentBuilder
import sh.nino.discord.punishments.builder.PublishModLogBuilder

interface PunishmentModule {
    /**
     * Resolves the current [member] to get the actual member object IF the current
     * [member] object is a partial member instance.
     */
    suspend fun resolveMember(member: MemberLike, useRest: Boolean = false): Member

    /**
     * Adds a warning to the [member].
     * @param member The member to add warnings towards.
     * @param moderator The moderator who invoked this action.
     * @param reason The reason why the [member] needs to be warned.
     * @param amount The amount of warnings to add. If [amount] is set to `null`,
     * it'll just add the amount of warnings from the [member] in the guild by 1.
     */
    suspend fun addWarning(
        member: Member,
        moderator: Member,
        reason: String? = null,
        amount: Int = 1,
        expiresIn: LocalDateTime? = null
    )

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
    suspend fun removeWarning(
        member: Member,
        moderator: Member,
        reason: String? = null,
        amount: Int? = null
    )

    /**
     * Applies a new punishment to a user, if needed.
     * @param member The [member][MemberLike] to execute this action.
     * @param moderator The moderator who executed this action.
     * @param type The punishment type that is being executed.
     * @param builder DSL builder for any extra options.
     */
    suspend fun apply(
        member: MemberLike,
        moderator: Member,
        type: PunishmentType,
        builder: ApplyPunishmentBuilder.() -> Unit = {}
    )

    /**
     * Publishes the [case] towards the mod-log channel if specified
     * in guild settings.
     *
     * @param case The case to use to send out the modlog embed.
     * @param builder The builder DSL to use
     */
    suspend fun publishModlog(
        case: GuildCasesEntity,
        builder: PublishModLogBuilder.() -> Unit = {}
    )

    /**
     * Edits the mod log message with the edited [case] properties.
     * @param case The case to use to send out the modlog embed.
     * @param message The message itself.
     */
    suspend fun editModlogMessage(
        case: GuildCasesEntity,
        message: Message
    )
}
