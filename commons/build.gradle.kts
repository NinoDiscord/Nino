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

plugins {
    `nino-module`
}

dependencies {
    // Kotlin libraries
    api(kotlin("reflect"))

    // BOMs
    api(platform("org.jetbrains.kotlinx:kotlinx-serialization-bom:1.3.2"))
    api(platform("org.jetbrains.kotlinx:kotlinx-coroutines-bom:1.6.1"))
    api(platform("org.jetbrains.exposed:exposed-bom:0.38.2"))
    api(platform("io.ktor:ktor-bom:2.0.0"))

    // kotlinx.coroutines
    api("org.jetbrains.kotlinx:kotlinx-coroutines-core")
    api("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8")

    // kotlinx.serialization
    api("org.jetbrains.kotlinx:kotlinx-serialization-protobuf")
    api("org.jetbrains.kotlinx:kotlinx-serialization-json")
    api("org.jetbrains.kotlinx:kotlinx-serialization-core")

    // kotlinx.datetime
    api("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")

    // Noel's Utilities
    api("gay.floof.commons", "commons-slf4j", "1.3.0")

    // Apache Utilities
    api("org.apache.commons:commons-lang3:3.12.0")

    // Koin
    api("io.insert-koin:koin-core:3.2.0")

    // Ktor (client)
    api("io.ktor:ktor-serialization-kotlinx-json")
    api("io.ktor:ktor-client-content-negotiation")
    api("io.ktor:ktor-client-websockets")
    api("io.ktor:ktor-client-okhttp")
    api("io.ktor:ktor-client-core")
    api("com.squareup.okhttp3:okhttp:4.9.3")

    // Kord
    api("dev.kord:kord-core:0.8.0-M13")
    api("dev.kord.x:emoji:0.5.0")

    // Database (PostgreSQL)
    api("org.jetbrains.exposed:exposed-core")
    api("org.jetbrains.exposed:exposed-jdbc")
    api("org.jetbrains.exposed:exposed-dao")

    // PostgreSQL driver
    api("org.postgresql:postgresql:42.3.4")

    // Connection pooling
    api("com.zaxxer:HikariCP:5.0.1")

    // SLF4J
    api("org.slf4j:slf4j-api:1.7.36")

    // Sentry
    api("io.sentry:sentry-kotlin-extensions:5.7.3")
    api("io.sentry:sentry:5.7.3")

    // Conditional logic for logback
    api("org.codehaus.janino:janino:3.1.7")

    // Redis (Lettuce)
    api("io.lettuce:lettuce-core:6.1.8.RELEASE")
}
