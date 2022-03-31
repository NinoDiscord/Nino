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

plugins {
    `nino-module`
}

dependencies {
    // common kotlin libraries for all projects
    api(kotlin("reflect"))

    // kotlinx libraries
    api(platform("org.jetbrains.kotlinx:kotlinx-coroutines-bom:1.6.0"))
    api("org.jetbrains.kotlinx:kotlinx-coroutines-core")
    api("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8")
    api(platform("org.jetbrains.kotlinx:kotlinx-serialization-bom:1.3.1"))
    api("org.jetbrains.kotlinx:kotlinx-serialization-protobuf")
    api("org.jetbrains.kotlinx:kotlinx-serialization-json")
    api("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")
    api("org.jetbrains.kotlinx:kotlinx-serialization-core")

    // Noel Utilities
    api("gay.floof.commons", "commons-slf4j", "1.1.0")

    // Apache Utilities
    api("org.apache.commons:commons-lang3:3.12.0")

    // Common dependencies that most projects need
    // Kord, Koin, DB, etc
    api(platform("io.ktor:ktor-bom:1.6.8"))
//        implementation("io.ktor:ktor-client-websockets")
    api("com.squareup.okhttp3:okhttp:4.9.3")
//        implementation("io.ktor:ktor-client-okhttp")
//        implementation("io.ktor:ktor-client-core")
    api("io.insert-koin:koin-core:3.1.5")
    api("dev.kord:kord-core:0.8.0-M9")
    api("io.lettuce:lettuce-core:6.1.8.RELEASE")
    api(platform("org.jetbrains.exposed:exposed-bom:0.36.1"))
    api("org.jetbrains.exposed:exposed-kotlin-datetime")
    api("org.jetbrains.exposed:exposed-core")
    api("org.jetbrains.exposed:exposed-jdbc")
    api("org.jetbrains.exposed:exposed-dao")
    api("org.postgresql:postgresql:42.3.1")
    api("com.zaxxer:HikariCP:5.0.1")
    api("org.slf4j:slf4j-api:1.7.35")
    api("io.sentry:sentry:5.6.0")
    api("io.sentry:sentry-logback:5.6.0")
//        implementation("io.ktor:ktor-serialization-kotlinx-json")
//        implementation("io.ktor:ktor-client-content-negotiation")
    api("dev.kord.x:emoji:0.5.0")

    // TODO: remove this once Kord supports KTOR 2
    api("io.ktor:ktor-serialization")
    api("io.ktor:ktor-client-okhttp")
    api("io.ktor:ktor-client-core")


    // Conditional logic for logback
    api("org.codehaus.janino:janino:3.1.6")

    // Prometheus
    api("io.prometheus:simpleclient_hotspot:0.14.1")
    api("io.prometheus:simpleclient:0.14.0")
}
