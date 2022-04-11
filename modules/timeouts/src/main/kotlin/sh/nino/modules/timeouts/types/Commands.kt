package sh.nino.modules.timeouts.types

import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject

/**
 * Represents a command to send to the server.
 */
open class Command {
    companion object: SerializationStrategy<Command> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("sh.nino.timeouts.Command") {
            element("op", OperationType.serializer().descriptor)
            element("d", JsonObject.serializer().descriptor)
        }

        override fun serialize(encoder: Encoder, value: Command) {
            val composite = encoder.beginStructure(descriptor)
            when (value) {
                is RequestCommand -> {
                    composite.encodeSerializableElement(descriptor, 0, OperationType.serializer(), OperationType.Request)
                    composite.encodeSerializableElement(descriptor, 1, RequestCommand.serializer(), value)
                }

                is RequestAllCommand -> {
                    composite.encodeSerializableElement(descriptor, 0, OperationType.serializer(), OperationType.Request)
                    composite.encodeSerializableElement(descriptor, 1, JsonObject.serializer(), buildJsonObject {})
                }

                is StatsCommand -> {
                    composite.encodeSerializableElement(descriptor, 0, OperationType.serializer(), OperationType.Stats)
                    composite.encodeSerializableElement(descriptor, 1, JsonObject.serializer(), buildJsonObject {})
                }
            }
        }
    }
}

@Serializable
class RequestCommand(val timeout: Timeout): Command()

@Serializable
class RequestAllCommand: Command()

@Serializable
class StatsCommand: Command()
