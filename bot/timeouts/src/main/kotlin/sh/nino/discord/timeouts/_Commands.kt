/*
 * Copyright (c) 2019-2022 Nino
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

package sh.nino.discord.timeouts

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonObject

/**
 * Represents the operation type of command or payload.
 */
@Serializable(with = OPCode.Companion.Serializer::class)
open class OPCode(val code: Int) {
    /**
     * This is a **server -> client** operation code.
     *
     * This indicates that the connection was successful. You will be emitted a [ReadyEvent]
     * event.
     */
    object Ready: OPCode(0)

    /**
     * This is a **server -> client** operation code.
     *
     * This indicates that a timeout packet has fulfilled its lifetime, and we need to do a
     * reverse operation. You will be emitted a [ApplyEvent] event.
     */
    object Apply: OPCode(1)

    /**
     * This is a **client -> server** operation code.
     *
     * Requests all the timeouts that are being handled by the server.
     */
    object RequestAll: OPCode(2)

    /**
     * This is a **client -> server** operation code.
     *
     * This returns statistics about the microservice including the runtime, the ping from client -> server (for Instatus),
     * and more.
     */
    object Stats: OPCode(3)

    companion object {
        object Serializer: KSerializer<OPCode> {
            override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("sh.nino.timeouts.OPCode", PrimitiveKind.INT)
            override fun deserialize(decoder: Decoder): OPCode = get(decoder.decodeInt())
            override fun serialize(encoder: Encoder, value: OPCode) {
                encoder.encodeInt(value.code)
            }
        }

        private val _values = setOf(Ready, Apply, RequestAll, Stats)
        operator fun get(code: Int): OPCode = _values.find { it.code == code } ?: error("Unknown OPCode: $code")
    }
}

/**
 * Represents a base command to send. Use [RequestCommand], [StatsCommand], or [RequestAllCommand]
 * to send out a command in a [Client].
 */
sealed class Command {
    companion object: SerializationStrategy<Command> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("sh.nino.timeouts.Command") {
            element("op", OPCode.Companion.Serializer.descriptor)
            element("d", JsonObject.serializer().descriptor)
        }

        override fun serialize(encoder: Encoder, value: Command) {
            val composite = encoder.beginStructure(descriptor)
            when (value) {
                is RequestCommand -> {
                    composite.encodeSerializableElement(descriptor, 0, OPCode.serializer(), OPCode.Ready)
                    composite.encodeSerializableElement(descriptor, 1, RequestCommand.serializer(), value)
                }

                is RequestAllCommand -> {
                    composite.encodeSerializableElement(descriptor, 0, OPCode.serializer(), OPCode.RequestAll)
                    composite.encodeSerializableElement(descriptor, 1, RequestAllCommand.serializer(), value)
                }
            }

            composite.endStructure(descriptor)
        }
    }
}

/**
 * Requests a [timeout] to be executed at a specific time.
 */
@Serializable
class RequestCommand(val timeout: Timeout): Command()

/**
 * Command to request all the concurrent [timeouts] that are being handled.
 */
@Serializable
class RequestAllCommand(val timeouts: List<Timeout>): Command()
