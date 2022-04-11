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

import dev.kord.cache.api.query
import dev.kord.core.Kord
import dev.kord.core.cache.data.UserData
import dev.kord.core.cache.idEq
import dev.kord.core.entity.Member
import dev.kord.core.entity.Role
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.Channel
import kotlinx.coroutines.flow.firstOrNull
import sh.nino.commons.extensions.asSnowflake
import sh.nino.commons.extensions.inject
import sh.nino.commons.extensions.sortWith

/**
 * Calculates a list of users from the specified arguments provided. It will try to find
 * the user from cache, and you can retrieve users the following ways:
 *
 * - Using a user mention (`<@!280158289667555328>`)
 * - Passing in "User#Discrim" (August#5820)
 * - Passing in a Snowflake (`280158289667555328`)
 *
 * @param args The arguments from the command parser to retrieve the users.
 * @return a list of [users][User], if any were found.
 */
suspend fun getMultipleUsersFromArgs(args: List<String>): List<User> {
    // Grab the current Kord instance
    val kord by inject<Kord>()
    val users = mutableListOf<User>()

    // Check if we can get any by the mention
    val mentions = args.filter { it.matches(Constants.UserMentionRegex) }
    for (mention in mentions) {
        val matcher = Constants.UserMentionRegex.toPattern().matcher(mention)
        if (!matcher.matches()) continue

        val id = matcher.group(1)
        val user = kord.getUser(id.asSnowflake())
        if (user != null) {
            users.add(user)
        }
    }

    // Maybe by ID?
    val ids = args.filter { it.matches(Constants.IdRegex) }
    for (id in ids) {
        val user = kord.getUser(id.asSnowflake())
        if (user != null) {
            users.add(user)
        }
    }

    // Check if we need to get by User#Discrim
    val userDiscrims = args.filter { it.matches(Constants.UserDiscrimRegex) }
    for (u in userDiscrims) {
        val ud = u.split("#")

        // Check if we can query it from local cache
        val user = kord.cache.query<UserData> {
            idEq(UserData::username, ud.first())
            idEq(UserData::discriminator, ud.last())
        }.singleOrNull()

        if (user != null) {
            val usr = User(user, kord)
            users.add(usr)
        }
    }

    return users
        .distinct() // remove dups
        .toList() // immutable
}

/**
 * Calculates a list of channels from the specified arguments provided. It will try to find
 * the channel in cache, and you can retrieve channels by:
 *
 * - Passing a channel mention (`<#794101954158526474>`)
 * - Passing a snowflake (`794101954158526474`)
 *
 * @param args The arguments from the command parser to retrieve the channels.
 * @return a list of [channels][Channel], if any were found.
 */
suspend fun getMultipleChannelsFromArgs(args: List<String>): List<Channel> {
    // Grab the current Kord instance
    val kord by inject<Kord>()
    val channels = mutableListOf<Channel>()

    // Check if we can get the mention of the channel
    val mentions = args.filter { it.matches(Constants.ChannelMentionRegex) }
    for (mention in mentions) {
        val matcher = Constants.ChannelMentionRegex.toPattern().matcher(mention)
        if (!matcher.matches()) continue

        val id = matcher.group(1)
        val channel = kord.getChannel(id.asSnowflake())
        if (channel != null) channels.add(channel)
    }

    // Check if we can get the channel ID
    val ids = args.filter { it.matches(Constants.IdRegex) }
    for (id in ids) {
        val channel = kord.getChannel(id.asSnowflake())
        if (channel != null) channels.add(channel)
    }

    return channels
        .distinct() // remove dups
        .toList() // immutable
}

/**
 * Returns the highest role this [member] has.
 * @param member The member to check the highest role.
 * @returns The [Role] that was found or `null` if none was found.
 */
suspend fun getTopRoleOf(member: Member): Role? = member
    .roles
    .sortWith { a, b -> b.rawPosition - a.rawPosition }
    .firstOrNull()

/**
 * Checks if [role A][a] is above [role B][b] in hierarchy (or vice-versa).
 * @param a The first role
 * @param b The second role
 * @return If the first role is higher than the second role.
 */
fun isRoleAbove(a: Role?, b: Role?): Boolean {
    if (a == null || b == null) return false

    return a.rawPosition > b.rawPosition
}

/**
 * Checks if [member A][a] is above [member B][b] in hierarchy (or vice-versa)
 */
suspend fun isMemberAbove(a: Member, b: Member): Boolean = isRoleAbove(getTopRoleOf(a), getTopRoleOf(b))
