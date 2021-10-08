package sh.nino.discord.modules.clustering.types

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = OperationType.Companion::class)
enum class OperationType(val value: Int) {
    Handshaking(0),      // client -> server
    ShardData(1),        // server -> client
    Heartbeat(2),        // server -> client
    HeartbeatAck(3),     // client -> server
    Eval(4),             // client -> server
    BroadcastEval(5),    // client -> server
    BroadcastEvalAck(6), // server -> client
    Stats(7),            // server -> client
    StatsAck(8),         // client -> server
    Ready(9),            // client -> server
    Entity(10),          // client -> server
    EntityAck(11);       // server -> client

    companion object: KSerializer<OperationType> {
        override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("op", PrimitiveKind.INT)

        override fun deserialize(decoder: Decoder): OperationType {
            val code = decoder.decodeInt()
            return values().find { it.value == code } ?: error("Unknown op: $code")
        }

        override fun serialize(encoder: Encoder, value: OperationType) {
            encoder.encodeInt(value.value)
        }
    }
}
