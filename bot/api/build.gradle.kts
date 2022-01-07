/**
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

dependencies {
    implementation("io.prometheus:simpleclient_hotspot:0.14.1")
    implementation("io.prometheus:simpleclient_common:0.14.0")
    implementation("io.insert-koin:koin-core:3.1.4")
    implementation("io.prometheus:simpleclient:0.14.1")
    implementation("io.ktor:ktor-serialization:2.0.0-beta-1")
    implementation("io.ktor:ktor-server-netty:2.0.0-beta-1")
    implementation("io.ktor:ktor-server-content-negotiation:2.0.0-beta-1")
    implementation("io.ktor:ktor-server-default-headers:2.0.0-beta-1")
    implementation("io.ktor:ktor-server-cors:2.0.0-beta-1")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.0.0-beta-1")
    implementation("io.ktor:ktor-server-double-receive:2.0.0-beta-1")
    implementation("dev.kord:kord-core:0.8.0-M8")
    implementation(project(":bot:metrics"))
    implementation(project(":bot:core"))
    implementation("io.lettuce:lettuce-core:6.1.5.RELEASE")
    implementation("io.sentry:sentry:5.5.1")
    api("org.slf4j:slf4j-api:1.7.32")
}
