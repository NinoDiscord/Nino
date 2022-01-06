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
    // Koin (Dependency Injection)
    implementation("io.insert-koin:koin-core:3.1.4")

    // Logging (SLF4J + Logback)
    api("org.slf4j:slf4j-api:1.7.32")

    // Kord
    implementation("dev.kord.cache:cache-redis:0.3.0")

    // Ktor (http client)
    implementation("io.ktor:ktor-client-serialization:1.6.7")
    implementation("io.ktor:ktor-client-websockets:1.6.7")
    implementation("com.squareup.okhttp3:okhttp:4.9.3")
    implementation("io.ktor:ktor-client-okhttp:1.6.7")
    implementation("io.ktor:ktor-client-core:1.6.7")

    // Kord
    implementation("dev.kord:kord-core:0.8.0-M8")

    // Database (Exposed, HikariCP, PostgreSQL)
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:0.36.1")
    implementation("org.jetbrains.exposed:exposed-core:0.36.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.36.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.36.1")
    implementation("org.postgresql:postgresql:42.3.1")
    implementation("com.zaxxer:HikariCP:5.0.0")

    // Sentry (error handling as a service :^)
    implementation("io.sentry:sentry:5.5.1")

    // Lettuce (Redis client)
    implementation("io.lettuce:lettuce-core:6.1.5.RELEASE")

    // Nino projects
    implementation(project(":bot:timeouts"))
    implementation(project(":bot:database"))
    implementation(project(":bot:api"))

    // owo
    implementation("org.apache.commons:commons-lang3:3.12.0")
}
