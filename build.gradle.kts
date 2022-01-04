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

import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import gay.floof.gradle.utils.*

buildscript {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            url = uri("https://maven.floofy.dev/repo/releases")
        }
    }

    dependencies {
        classpath("org.jetbrains.kotlinx:atomicfu-gradle-plugin:0.17.0")
        classpath("gradle.plugin.com.github.johnrengelman:shadow:7.1.1")
        classpath("com.diffplug.spotless:spotless-plugin-gradle:6.0.5")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.6.10")
        classpath("org.jetbrains.kotlin:kotlin-serialization:1.6.10")
        classpath("io.kotest:kotest-gradle-plugin:0.3.9")
        classpath("gay.floof.utils:gradle-utils:1.1.0")
    }
}

plugins {
    id("com.github.johnrengelman.shadow") version "7.1.0"
    kotlin("plugin.serialization") version "1.6.10"
    id("com.diffplug.spotless") version "6.0.0"
    kotlin("jvm") version "1.6.10"
    id("io.kotest") version "0.3.9"
    application
}

val current = Version(2, 0, 0, 0, ReleaseType.Beta)
group = "sh.nino"
version = "$current"

repositories {
    mavenCentral()
    mavenLocal()
    jcenter()
    noel()
}

subprojects {
    group = "sh.nino.bot"
    version = if (project.version != "unspecified") project.version else "$current"

    // apply plugins
    apply(plugin = "org.jetbrains.kotlin.plugin.serialization")
    apply(plugin = "com.diffplug.spotless")
    apply(plugin = "kotlinx-atomicfu")
    apply(plugin = "kotlin")

    if (project.name == "bot") {
        apply(plugin = "com.github.johnrengelman.shadow")
        apply(plugin = "application")
    }

    repositories {
        mavenCentral()
        mavenLocal()
        jcenter()
        noel()
    }

    dependencies {
        // common kotlin libraries for all projects
        implementation(kotlin("reflect", "1.6.10"))
        implementation(kotlin("stdlib", "1.6.10"))

        // kotlinx libraries
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2-native-mt")
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.5.2-native-mt")
        implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.1")
        implementation("org.jetbrains.kotlinx:kotlinx-datetime-jvm:0.3.1")
        api("org.jetbrains.kotlinx:kotlinx-serialization-core:1.3.1")

        // Noel Utilities
        floof("commons", "commons-slf4j", "1.1.0")

        // Testing utilities
        testImplementation("io.kotest:kotest-runner-junit5-jvm:5.0.3")
        testImplementation("io.kotest:kotest-assertions-core-jvm:5.0.3")
        testImplementation("io.kotest:kotest-property-jvm:5.0.3")

        // do not link :bot:commons to the project itself
        if (this@subprojects.name != "commons") {
            implementation(project(":bot:commons"))
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
            ktlint("0.43.0")
                .userData(mapOf(
                    "no-consecutive-blank-lines" to "true",
                    "no-unit-return" to "true",
                    "disabled_rules" to "no-wildcard-imports,colon-spacing",
                    "indent_size" to "4"
                ))
        }
    }

    // Setup the application for `:bot`
    if (project.name == "bot") {
        application {
            mainClass.set("sh.nino.discord.Bootstrap")
            java {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
    }

    // Setup all tasks for projects
    tasks {
        compileKotlin {
            kotlinOptions.jvmTarget = JavaVersion.VERSION_17.toString()
            kotlinOptions.javaParameters = true
            kotlinOptions.freeCompilerArgs += listOf(
                "-Xopt-in=kotlin.RequiresOptIn"
            )
        }

        build {
            if (this@subprojects.name == "bot") {
                dependsOn(shadowJar)
            }

            dependsOn(spotlessApply)
        }

        if (this@subprojects.name == "bot") {
            named<ShadowJar>("shadowJar") {
                archiveFileName.set("Nino.jar")
                mergeServiceFiles()
                manifest {
                    attributes(mapOf(
                        "Manifest-Version" to "1.0.0",
                        "Main-Class" to "sh.nino.discord.Bootstrap"
                    ))
                }
            }
        }
    }
}
