package sh.nino.discord.modules.clustering.types

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject

@Serializable
open class DataPacket(val op: OperationType) {
    companion object: KSerializer<DataPacket> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("mika.clustering.DataPacket") {
            element("op", OperationType.descriptor)
            element("body", JsonObject.serializer().descriptor)
        }

        override fun serialize(encoder: Encoder, value: DataPacket) {
            val composite = encoder.beginStructure(descriptor)
        }

        override fun deserialize(decoder: Decoder): DataPacket = DataPacket(OperationType.ShardData)
    }
}

@Serializable
object Handshaking: DataPacket(OperationType.Handshaking)

@Serializable
object Heartbeat: DataPacket(OperationType.Heartbeat)

@Serializable
object HeartbeatAck: DataPacket(OperationType.HeartbeatAck)

@Serializable
data class ShardData(
    val id: String,
    val block: ShardBlock
): DataPacket(OperationType.ShardData)

@Serializable
data class ShardBlock(
    val shards: List<Int>,
    val total: Int
)

@Serializable
data class BroadcastEval(
    val id: String,
    val code: String
): DataPacket(OperationType.BroadcastEval)
