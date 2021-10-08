package sh.nino.discord.core.automod

import dev.kord.core.event.guild.MemberJoinEvent
import dev.kord.core.event.guild.MemberUpdateEvent
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.event.user.UserUpdateEvent
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun automod(builder: AutomodBuilder.() -> Unit): Automod {
    contract {
        callsInPlace(builder, InvocationKind.EXACTLY_ONCE)
    }

    val obj = AutomodBuilder().apply(builder)
    return obj.build()
}

class Automod(
    val name: String,
    private val onMessageCall: AutomodCallable<MessageCreateEvent>?,
    private val onUserUpdateCall: AutomodCallable<UserUpdateEvent>?,
    private val onMemberJoinCall: AutomodCallable<MemberJoinEvent>?,
    private val onMemberNickUpdateCall: AutomodCallable<MemberUpdateEvent>?
) {
    // Why is `event` dynamic?
    // So you can pass in any event-driven class from Kord,
    // and the `execute` function will cast the [event]
    // so its correspondant event or else it'll fail.
    suspend fun execute(event: Any): Boolean = when {
        onMessageCall != null -> {
           val ev = event as? MessageCreateEvent ?: error("Unable to cast ${event::class} -> MessageCreateEvent")
           onMessageCall.invoke(ev)
        }

        onUserUpdateCall != null -> {
            val ev = event as? UserUpdateEvent ?: error("Unable to cast ${event::class} -> UserUpdateEvent")
            onUserUpdateCall.invoke(ev)
        }

        onMemberJoinCall != null -> {
            val ev = event as? MemberJoinEvent ?: error("Unable to cast ${event::class} -> MemberJoinEvent")
            onMemberJoinCall.invoke(ev)
        }

        onMemberNickUpdateCall != null -> {
            val ev = event as? MemberUpdateEvent ?: error("Unable to cast ${event::class} -> MemberUpdateEvent")
            onMemberNickUpdateCall.invoke(ev)
        }

        else -> error("Automod $name doesn't implement any automod callables. (Used event ${event::class})")
    }
}
