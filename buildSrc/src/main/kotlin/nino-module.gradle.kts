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
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("plugin.serialization")
    id("com.diffplug.spotless")
    id("kotlinx-atomicfu")
    id("io.kotest")
    kotlin("jvm")
}

val javaVersion = JavaVersion.VERSION_17

group = "sh.nino.bot"
version = if (project.version != "unspecified") project.version else "$current"

repositories {
    //noelware(snapshots = true)
    maven("https://repo.perfectdreams.net/")
    mavenCentral()
    mavenLocal()
    noel()
}

dependencies {
    // Testing utilities
    testImplementation(platform("io.kotest:kotest-bom:5.2.3"))
    testImplementation("io.kotest:kotest-runner-junit5")
    testImplementation("io.kotest:kotest-assertions-core")
    testImplementation("io.kotest:kotest-property")

    // do not link :bot:commons to the project itself
    if (name != "commons") {
        implementation(project(":commons"))
    }
}

// Setup Spotless in all subprojects
spotless {
    kotlin {
        trimTrailingWhitespace()
        licenseHeaderFile("${rootProject.projectDir}/assets/HEADING")
        endWithNewline()

        // We can't use the .editorconfig file, so we'll have to specify it here
        // issue: https://github.com/diffplug/spotless/issues/142
        // ktlint 0.35.0 (default for Spotless) doesn't support trailing commas
        ktlint("0.43.0").userData(
            mapOf(
                "no-consecutive-blank-lines" to "true",
                "no-unit-return" to "true",
                "disabled_rules" to "no-wildcard-imports,colon-spacing",
                "indent_size" to "4"
            )
        )
    }
}

tasks {
    withType<KotlinCompile> {
        kotlinOptions {
            jvmTarget = javaVersion.toString()
            javaParameters = true
            freeCompilerArgs += "-opt-in=kotlin.RequiresOptIn"
        }
    }
}

java {
//    sourceCompatibility = javaVersion
//    targetCompatibility = javaVersion

    toolchain.languageVersion.set(JavaLanguageVersion.of(17))
}
