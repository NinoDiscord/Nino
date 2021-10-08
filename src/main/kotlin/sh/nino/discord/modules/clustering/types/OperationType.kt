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
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = OperationType.Companion::class)
enum class OperationType(val value: Int) {
    Handshaking(0), // client -> server
    ShardData(1), // server -> client
    Heartbeat(2), // server -> client
    HeartbeatAck(3), // client -> server
    Eval(4), // client -> server
    BroadcastEval(5), // client -> server
    BroadcastEvalAck(6), // server -> client
    Stats(7), // server -> client
    StatsAck(8), // client -> server
    Ready(9), // client -> server
    Entity(10), // client -> server
    EntityAck(11); // server -> client

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
