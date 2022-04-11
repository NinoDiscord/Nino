package sh.nino.modules.timeouts.types

import sh.nino.modules.timeouts.Client

interface Event {
    val client: Client
}

/**
 * This indicates that the connection was successful.
 */
class ReadyEvent(override val client: Client): Event

/**
 * This indicates that a timeout packet has fulfilled its lifetime, and we need to do a
 * reverse operation.
 */
class ApplyEvent(override val client: Client, val timeout: Timeout): Event
