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

package sh.nino.discord.clustering.types

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = OPType.Companion::class)
open class OPType(val id: Int) {
    object Handshaking: OPType(0)
    object ShardData: OPType(1)
    object Heartbeat: OPType(2)
    object HeartbeatAck: OPType(3)
    object Eval: OPType(4)
    object BroadcastEval: OPType(5)
    object BroadcastEvalAck: OPType(6)
    object Stats: OPType(7)
    object StatsAck: OPType(8)
    object Ready: OPType(9)
    object Entity: OPType(10)
    object EntityAck: OPType(11)

    companion object: KSerializer<OPType> {
        override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("mikabot.OPType", PrimitiveKind.INT)
        private val opTypes: Map<Int, OPType> = mapOf(
            0 to Handshaking,
            1 to ShardData,
            2 to Heartbeat,
            3 to HeartbeatAck,
            4 to Eval,
            5 to BroadcastEval,
            6 to BroadcastEvalAck,
            7 to Stats,
            8 to StatsAck,
            9 to Ready,
            10 to Entity,
            11 to EntityAck
        )

        override fun deserialize(decoder: Decoder): OPType {
            val opType = decoder.decodeInt()
            return opTypes[opType] ?: error("Unable to serialize operation type $opType.")
        }

        override fun serialize(encoder: Encoder, value: OPType) {
            encoder.encodeInt(value.id)
        }
    }
}
