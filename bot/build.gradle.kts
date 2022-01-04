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

import java.text.SimpleDateFormat
import gay.floof.gradle.utils.*
import java.util.Date
import java.io.File

val commitHash by lazy {
    val cmd = "git rev-parse --short HEAD".split("\\s".toRegex())
    val proc = ProcessBuilder(*cmd.toTypedArray())
        .directory(File("."))
        .redirectOutput(ProcessBuilder.Redirect.PIPE)
        .redirectError(ProcessBuilder.Redirect.PIPE)
        .start()

    proc.waitFor(1, TimeUnit.MINUTES)
    proc.inputStream.bufferedReader().readText().trim()
}

dependencies {
    // Nino libraries + projects
    implementation(project(":bot:automod"))
    implementation(project(":bot:commands"))
    implementation(project(":bot:core"))
    implementation(project(":bot:punishments"))
    implementation(project(":bot:api"))
    implementation(project(":bot:database"))

    // Logging (slf4j + logback)
    implementation("ch.qos.logback:logback-classic:1.2.10")
    implementation("ch.qos.logback:logback-core:1.2.10")
    api("org.slf4j:slf4j-api:1.7.32")

    // Koin
    implementation("io.insert-koin:koin-core:3.1.4")

    // YAML (configuration)
    implementation("com.charleskorn.kaml:kaml:0.38.0")
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
    }
}
