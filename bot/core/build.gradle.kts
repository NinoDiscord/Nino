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

dependencies {
    // kotlinx libraries
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2-native-mt")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.5.2-native-mt")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.1")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime-jvm:0.3.1")
    api("org.jetbrains.kotlinx:kotlinx-serialization-core:1.3.1")

    // Koin (Dependency Injection)
    implementation("io.insert-koin:koin-logger-slf4j:3.1.4")
    implementation("io.insert-koin:koin-core-ext:3.0.2")

    // Logging (SLF4J + Logback)
    api("org.slf4j:slf4j-api:1.7.32")

    // Kord
    implementation("dev.kord.cache:cache-redis:0.3.0")

    // Ktor (http client)
    implementation("io.ktor:ktor-client-serialization:1.6.7")
    implementation("io.ktor:ktor-client-websockets:1.6.7")
    implementation("io.ktor:ktor-client-okhttp:1.6.7")
    implementation("io.ktor:ktor-client-core:1.6.7")

    // Kord
    implementation("dev.kord:kord-core:0.8.0-M7")

    // YAML (configuration)
    implementation("com.charleskorn.kaml:kaml:0.37.0")

    // Database (Exposed, HikariCP, PostgreSQL)
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:0.36.1")
    implementation("org.jetbrains.exposed:exposed-core:0.36.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.36.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.36.1")
    implementation("org.postgresql:postgresql:42.3.1")
    implementation("com.zaxxer:HikariCP:5.0.0")

    // Sentry (error handling as a service :^)
    implementation("io.sentry:sentry:5.5.0")

    // Lettuce (Redis client)
    implementation("io.lettuce:lettuce-core:6.1.5.RELEASE")
}
