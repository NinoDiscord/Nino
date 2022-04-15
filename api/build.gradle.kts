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

import java.text.SimpleDateFormat
import java.util.Date

plugins {
    `nino-module`
    application
}

dependencies {
    // Logging
    implementation("ch.qos.logback:logback-classic:1.2.11")
    implementation("ch.qos.logback:logback-core:1.2.11")

    // YAML (configuration)
    implementation("com.charleskorn.kaml:kaml:0.43.0")

    // Logstash encoder for Logback
    implementation("net.logstash.logback:logstash-logback-encoder:7.1.1")

    // Ktor (server)
    implementation("io.prometheus:simpleclient_common:0.15.0")
    implementation("io.ktor:ktor-server-netty")

    // Sentry (logback)
    implementation("io.sentry:sentry-logback:5.7.3")
}

application {
    mainClass.set("sh.nino.api.Bootstrap")
}

tasks {
    processResources {
        filesMatching("build-info.json") {
            val date = Date()
            val formatter = SimpleDateFormat("EEE, MMM d, YYYY - HH:mm:ss a")

            expand(
                mapOf(
                    "version" to rootProject.version,
                    "commitSha" to commitHash,
                    "buildDate" to formatter.format(date)
                )
            )
        }
    }

    build {
        dependsOn(processResources)
        dependsOn(spotlessApply)
        dependsOn(installDist)
        dependsOn(kotest)
    }
}
