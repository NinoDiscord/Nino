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

import dev.kord.core.entity.Member
import dev.kord.core.entity.Role
import kotlinx.coroutines.flow.firstOrNull
import sh.nino.discord.extensions.sortWith

/**
 * Returns the highest role this [member] has. Returns null if nothing was found.
 * @param member The member to check.
 */
suspend fun getTopRole(member: Member): Role? = member
    .roles
    .sortWith { a, b -> b.rawPosition - a.rawPosition }
    .firstOrNull()

/**
 * Checks if [role a][a] is above [role b][b] in hierarchy (or vice-versa)
 * @param a The role that should be higher
 * @param b The role that should be lower
 */
fun isRoleAbove(a: Role?, b: Role?): Boolean {
    if (a == null || b == null) return false

    return a.rawPosition > b.rawPosition
}

/**
 * Checks if [member a][a] is above [member b][b] in hierarchy (or vice-versa)
 */
suspend fun isMemberAbove(a: Member, b: Member): Boolean = isRoleAbove(getTopRole(a), getTopRole(b))

/**
 * Returns if the user's bitfield permission reaches the threshold of the [required] bitfield.
 * @param user The user bitfield to use.
 * @param required The required permission bitfield.
 */
fun hasOverlap(user: Int, required: Int): Boolean = (user and 8) != 0 || (user and required) == required
