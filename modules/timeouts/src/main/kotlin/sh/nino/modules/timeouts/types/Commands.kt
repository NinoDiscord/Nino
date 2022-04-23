/*
 * 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
 * Copyright (c) 2019-2022 Nino Team
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

package sh.nino.modules.timeouts.types

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonObject
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
