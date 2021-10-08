package sh.nino.discord.core.command.subcommand

import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun subcommand(builder: SubcommandBuilder.() -> Unit): Subcommand {
    contract {
        callsInPlace(builder, InvocationKind.EXACTLY_ONCE)
    }

    val obj = SubcommandBuilder().apply(builder)
    return obj.build()
}

class Subcommand
