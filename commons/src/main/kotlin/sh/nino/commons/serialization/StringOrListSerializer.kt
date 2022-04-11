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

package sh.nino.commons.serialization

import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.serializer
import sh.nino.commons.StringOrList

object StringOrListSerializer: KSerializer<StringOrList> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("nino.StringOrArray")

    override fun deserialize(decoder: Decoder): StringOrList = try {
        StringOrList(decoder.decodeSerializableValue(ListSerializer(serializer<String>())))
    } catch (_: Exception) {
        try {
            StringOrList(decoder.decodeString())
        } catch (e: Exception) {
            throw e
        }
    }

    override fun serialize(encoder: Encoder, value: StringOrList) {
        try {
            encoder.encodeSerializableValue(ListSerializer(serializer()), value.asList)
        } catch (_: Exception) {
            try {
                encoder.encodeString(value.asString)
            } catch (e: Exception) {
                throw e
            }
        }
    }
}
