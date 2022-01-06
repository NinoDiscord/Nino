package sh.nino.discord.common.serializers

import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import sh.nino.discord.common.StringOrArray

private val ListStringSerializer = ListSerializer(String.serializer())

object StringOrArraySerializer: KSerializer<StringOrArray> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("nino.StringToArray")

    override fun deserialize(decoder: Decoder): StringOrArray {
        return try {
            val list = decoder.decodeSerializableValue(ListStringSerializer)
            StringOrArray(list)
        } catch (_: Exception) {
            try {
                val str = decoder.decodeString()
                StringOrArray(str)
            } catch (e: Exception) {
                throw e
            }
        }
    }

    override fun serialize(encoder: Encoder, value: StringOrArray) {
        return try {
            val list = value.asList
            encoder.encodeSerializableValue(ListStringSerializer, list)
        } catch (ex: Exception) {
            try {
                val str = value.asString
                encoder.encodeString(str)
            } catch (e: Exception) {
                throw e
            }
        }
    }
}
