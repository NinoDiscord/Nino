package sh.nino.modules.timeouts.types

import kotlinx.serialization.Serializable
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

/**
 * Represents the operation type of command or payload.
 */
@Serializable(with = OperationType.Companion.Serializer::class)
open class OperationType(val code: Int) {
    /**
     * This is a **server -> client** operation code.
     *
     * This indicates that the connection was successful. You will be emitted a [ReadyEvent]
     * event.
     */
    object Ready: OperationType(0)

    /**
     * This is a **server -> client** operation code.
     *
     * This indicates that a timeout packet has fulfilled its lifetime, and we need to do a
     * reverse operation. You will be emitted a [ApplyEvent] event.
     */
    object Apply: OperationType(1)

    /**
     * This is a **client -> server** operation code.
     *
     * This creates a single timeout to the server itself.
     */
    object Request: OperationType(2)

    /**
     * This is a **client -> server** operation code.
     *
     * Requests all the timeouts that are being handled by the server.
     */
    object RequestAll: OperationType(3)

    /**
     * This is a **client -> server** operation code.
     *
     * This returns statistics about the microservice including the runtime, the ping from client -> server (for Instatus),
     * and more.
     */
    object Stats: OperationType(4)

    companion object {
        object Serializer: KSerializer<OperationType> {
            override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("sh.nino.timeouts.OperationType", PrimitiveKind.INT)
            override fun deserialize(decoder: Decoder): OperationType = get(decoder.decodeInt())
            override fun serialize(encoder: Encoder, value: OperationType) {
                encoder.encodeInt(value.code)
            }
        }

        private val operationTypes = setOf(Ready, Apply, RequestAll, Stats)
        operator fun get(code: Int): OperationType = operationTypes.find { it.code == code } ?: error("Unknown operation type: $code")
    }
}
