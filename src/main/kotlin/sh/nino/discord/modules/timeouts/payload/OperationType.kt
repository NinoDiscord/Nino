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

package sh.nino.discord.modules.timeouts.payload

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

/**
 * Returns the operation type when sending/receiving data.
 * @param op The operation type value.
 */
@Serializable(with = OperationType.Companion::class)
open class OperationType(val op: Int) {
    /**
     * This is a **server -> client** operation.
     *
     * This is when the server has acknowledged our presence, and we have
     * packets we need to execute.
     */
    object Ready: OperationType(0)

    /**
     * This is a **server -> client** operation.
     *
     * This is when the server needs to apply a timeout on someone.
     */
    object Apply: OperationType(1)

    /**
     * This is a **client -> server** operation.
     *
     * This is when the client needs to place a request for the actual timeout.
     */
    object Request: OperationType(2)

    /**
     * This is a **client -> server** operation.
     *
     * This is when the client has acknowledged the applied packet.
     */
    object Acknowledged: OperationType(3)

    companion object: KSerializer<OperationType> {
        private val values: Map<Int, OperationType> = mapOf(
            0 to Ready,
            1 to Apply,
            2 to Request,
            3 to Acknowledged
        )

        override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("nino.timeouts.OperationType", PrimitiveKind.INT)
        override fun deserialize(decoder: Decoder): OperationType = values[decoder.decodeInt()] ?: error("Unknown operation.")
        override fun serialize(encoder: Encoder, value: OperationType) {
            encoder.encodeInt(value.op)
        }
    }
}
