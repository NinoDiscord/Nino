/**
 * Copyright (c) 2019-2021 Nino
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

package sh.nino.discord.modules.clustering.types

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonObject

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
