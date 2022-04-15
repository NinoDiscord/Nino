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

package sh.nino.automod

import dev.kord.core.event.guild.MemberJoinEvent
import dev.kord.core.event.guild.MemberUpdateEvent
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.event.user.UserUpdateEvent

/**
 * Represents a builder class for constructing automod objects.
 */
class AutomodBuilder {
    private var onMemberNickUpdateCall: AutomodCallable<MemberUpdateEvent>? = null
    private var onMemberJoinCall: AutomodCallable<MemberJoinEvent>? = null
    private var onUserUpdateCall: AutomodCallable<UserUpdateEvent>? = null
    private var onMessageCall: AutomodCallable<MessageCreateEvent>? = null

    /**
     * Returns the name of the automod.
     */
    var name: String = ""

    /**
     * Hooks this [Automod] object to react on message create events
     * @param callable The callable function to execute
     */
    fun onMessage(callable: AutomodCallable<MessageCreateEvent>) {
        onMessageCall = callable
    }

    fun onUserUpdate(callable: AutomodCallable<UserUpdateEvent>) {
        onUserUpdateCall = callable
    }

    fun onMemberJoin(callable: AutomodCallable<MemberJoinEvent>) {
        onMemberJoinCall = callable
    }

    fun onMemberNickUpdate(callable: AutomodCallable<MemberUpdateEvent>) {
        onMemberNickUpdateCall = callable
    }

    fun build(): AutomodObject = AutomodObject(
        this.name,
        onMessageCall,
        onUserUpdateCall,
        onMemberJoinCall,
        onMemberNickUpdateCall
    )
}
