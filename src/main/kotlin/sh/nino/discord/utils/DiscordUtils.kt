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

package sh.nino.discord.utils

import dev.kord.common.annotation.*
import dev.kord.core.Kord
import dev.kord.core.entity.User
import org.koin.core.context.GlobalContext
import sh.nino.discord.extensions.asSnowflake

/**
 * Returns an [List] of [User] objects based from the [args]
 * provided.
 *
 * ## Example
 * ```kotlin
 * val users = getMultipleUsersFromArgs(listOf("<@!280158289667555328>", "Polarboi#2535"))
 * // => List<User>
 * ```
 */
@OptIn(KordUnsafe::class, KordExperimental::class)
suspend fun getMultipleUsersFromArgs(args: List<String>): List<User> {
    val koin = GlobalContext.get()
    val kord = koin.get<Kord>()

    val users = mutableListOf<User>()
    val usersByMention = args.filter {
        it.matches(Constants.USER_MENTION_REGEX.toRegex())
    }

    for (userMention in usersByMention) {
        val matcher = Constants.USER_MENTION_REGEX.matcher(userMention)

        // java is on some god who knows what crack
        // you have to explicitly call `Matcher#matches`
        // to retrieve groups without it erroring?????
        //
        // https://cute.floofy.dev/images/d52dddc2.png
        //
        // so if it doesn't match, skip
        // (shouldn't get here since the users list is filtered
        //  from the regex match but whatever.)
        if (!matcher.matches()) continue

        val id = matcher.group(1)
        val user = kord.getUser(id.asSnowflake())

        // if the user is found and is not in the
        // users list.
        if (user != null) users.add(user)
    }

    val usersById = args.filter {
        it.matches(Constants.ID_REGEX.toRegex())
    }

    for (userId in usersById) {
        val user = kord.getUser(userId.asSnowflake())
        if (user != null) users.add(user)
    }

    return users
        .distinct() // make the list unique, so no duplicates
        .toList() // make it immutable
        .ifEmpty { listOf() } // if the list is empty, return an empty list >:3
}
