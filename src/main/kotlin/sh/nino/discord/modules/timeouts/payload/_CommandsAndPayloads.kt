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

import dev.kord.gateway.OpCode
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.*
import sh.nino.discord.core.database.tables.PunishmentType

@Serializable
data class Timeout(
    val moderator: String,
    val expired: Int,
    val issued: Int,
    val reason: String?,
    val guild: String,
    val user: String,
    val type: PunishmentType
)

open class Command {
    companion object: SerializationStrategy<Command> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("nino.timeouts.Command") {
            element("op", OpCode.serializer().descriptor)
            element("d", JsonObject.serializer().descriptor, isOptional = true)
        }

        override fun serialize(encoder: Encoder, value: Command) {
            val composite = encoder.beginStructure(descriptor)
            when (value) {
                is RequestCommand -> {
                    composite.encodeSerializableElement(OperationType.descriptor, 0, OperationType, OperationType.Request)
                    composite.encodeSerializableElement(Timeout.serializer().descriptor, 1, Timeout.serializer(), value.timeout)
                }

                is AcknowledgedCommand -> {
                    val timeoutListSerializer = ListSerializer(Timeout.serializer())

                    composite.encodeSerializableElement(OperationType.descriptor, 0, OperationType, OperationType.Acknowledged)
                    composite.encodeSerializableElement(timeoutListSerializer.descriptor, 1, timeoutListSerializer, value.timeouts)
                }
            }

            composite.endStructure(descriptor)
        }
    }
}

@Serializable
data class RequestCommand(val timeout: Timeout): Command()

@Serializable
data class AcknowledgedCommand(val timeouts: List<Timeout>): Command()
