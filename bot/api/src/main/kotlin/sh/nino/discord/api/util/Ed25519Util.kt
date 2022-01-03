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

package sh.nino.discord.api.util

import org.apache.commons.codec.binary.Hex
import org.bouncycastle.asn1.edec.EdECObjectIdentifiers
import org.bouncycastle.asn1.x509.AlgorithmIdentifier
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo
import org.bouncycastle.jce.provider.BouncyCastleProvider
import java.security.KeyFactory
import java.security.Security
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

object Ed25519Util {
    private val provider = BouncyCastleProvider()
    private val KEY_FACTORY = KeyFactory.getInstance("ed25519", provider)

    init {
        Security.addProvider(provider)
    }

    fun verify(publicKey: String, signature: String, ts: String, data: String): Boolean {
        val keyInBytes = Hex.decodeHex(publicKey)
        val pki = SubjectPublicKeyInfo(AlgorithmIdentifier(EdECObjectIdentifiers.id_Ed25519), keyInBytes)
        val pkSpec = X509EncodedKeySpec(pki.encoded)
        val gPublicKey = KEY_FACTORY.generatePublic(pkSpec)
        val signedData = Signature.getInstance("ed25519", provider)

        signedData.initVerify(gPublicKey)
        signedData.update(ts.toByteArray(Charsets.UTF_8))
        signedData.update(data.toByteArray(Charsets.UTF_8))

        return signedData.verify(Hex.decodeHex(signature))
    }
}
