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

package sh.nino.discord.common

import dev.kord.core.Kord
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.Channel
import org.koin.core.context.GlobalContext
import sh.nino.discord.common.extensions.asSnowflake
import sh.nino.discord.common.extensions.retrieve

/**
 * Returns multiple users from a list of [arguments][args].
 * ```kt
 * val users = getMultipleUsersFromArgs(listOf("<@!280158289667555328>", "Polarboi#2535"))
 * // => [kotlin.List{280158289667555328, 743701282790834247}]
 * ```
 */
suspend fun getMutipleUsersFromArgs(args: List<String>): List<User> {
    val kord = GlobalContext.retrieve<Kord>()
    val users = mutableListOf<User>()
    val usersByMention = args.filter {
        it.matches(USER_MENTION_REGEX.toRegex())
    }

    for (mention in usersByMention) {
        val matcher = USER_MENTION_REGEX.matcher(mention)
        if (!matcher.matches()) continue

        val id = matcher.group(1)
        val user = kord.getUser(id.asSnowflake())
        if (user != null) users.add(user)
    }

    val usersById = args.filter {
        it.matches(ID_REGEX.toRegex())
    }

    for (userId in usersById) {
        val user = kord.getUser(userId.asSnowflake())
        if (user != null) users.add(user)
    }

    return users
        .distinct() // remove duplicates
        .toList() // immutable
}

suspend fun getMultipleChannelsFromArgs(args: List<String>): List<Channel> {
    val kord = GlobalContext.retrieve<Kord>()
    val channels = mutableListOf<Channel>()
    val channelsByMention = args.filter {
        it.matches(CHANNEL_REGEX.toRegex())
    }

    for (mention in channelsByMention) {
        val matcher = CHANNEL_REGEX.matcher(mention)
        if (!matcher.matches()) continue

        val id = matcher.group(1)
        val channel = kord.getChannel(id.asSnowflake())
        if (channel != null) channels.add(channel)
    }

    val channelsById = args.filter {
        it.matches(ID_REGEX.toRegex())
    }

    for (channelId in channelsById) {
        val channel = kord.getChannel(channelId.asSnowflake())
        if (channel != null) channels.add(channel)
    }

    return channels.distinct().toList()
}
