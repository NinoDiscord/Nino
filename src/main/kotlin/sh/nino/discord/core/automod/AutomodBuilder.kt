package sh.nino.discord.core.automod

import dev.kord.core.event.guild.MemberJoinEvent
import dev.kord.core.event.guild.MemberUpdateEvent
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.event.user.UserUpdateEvent
import sh.nino.discord.core.annotations.NinoDslMarker

typealias AutomodCallable<T> = suspend (T) -> Boolean

/**
 * Represents a builder class for constructing automod objects.
 */
@NinoDslMarker
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

    fun build(): Automod = Automod(
        this.name,
        onMessageCall,
        onUserUpdateCall,
        onMemberJoinCall,
        onMemberNickUpdateCall
    )
}
