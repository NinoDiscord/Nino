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

import gay.floof.gradle.utils.*

plugins {
    `nino-module`
}

dependencies {
    // Ktor (server)
    implementation("io.ktor:ktor-serialization-kotlinx-json")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-server-auto-head-response")
    implementation("io.ktor:ktor-server-default-headers")
    implementation("io.ktor:ktor-server-double-receive")
    implementation("io.ktor:ktor-server-call-logging")
    implementation("io.ktor:ktor-server-status-pages")
    implementation("io.ktor:ktor-serialization")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-cors")

    // JWT (for authentication)
    implementation("com.auth0:java-jwt:3.19.2")

    // Nino projects
    implementation(project(":core"))
    implementation(project(":modules"))
    implementation(project(":database"))
    implementation(project(":modules:metrics"))

    // Prometheus stuff
    implementation("io.prometheus:simpleclient_common:0.15.0")
}
