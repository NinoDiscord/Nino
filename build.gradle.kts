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

import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import java.text.SimpleDateFormat
import sh.nino.gradle.Version
import java.util.Date

plugins {
    id("com.github.johnrengelman.shadow") version "7.1.0"
    kotlin("plugin.serialization") version "1.6.0"
    id("com.diffplug.spotless") version "6.0.0"
    kotlin("jvm") version "1.6.0"
    application
}

val current = Version(2, 0, 0)
group = "sh.nino"
version = current.string()

repositories {
    mavenCentral()
    mavenLocal()
    maven {
        url = uri("https://maven.floofy.dev/repo/releases")
    }
}

dependencies {
    // Kotlin Libraries
    implementation(kotlin("reflect", "1.6.0"))
    implementation(kotlin("stdlib", "1.6.0"))
    runtimeOnly(kotlin("scripting-jsr223", "1.6.0"))

    // kotlinx libraries
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2-native-mt")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.5.2-native-mt")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.1")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime-jvm:0.3.1")
    api("org.jetbrains.kotlinx:kotlinx-serialization-core:1.3.1")

    // Koin (Dependency Injection)
    implementation("io.insert-koin:koin-logger-slf4j:3.1.3")
    implementation("io.insert-koin:koin-core-ext:3.0.2")

    // Logging (SLF4J + Logback)
    implementation("ch.qos.logback:logback-classic:1.2.7")
    implementation("ch.qos.logback:logback-core:1.2.7")
    api("org.slf4j:slf4j-api:1.7.32")

    // Ktor (http client)
    implementation("io.ktor:ktor-client-serialization:1.6.4")
    implementation("io.ktor:ktor-client-websockets:1.6.4")
    implementation("io.ktor:ktor-client-okhttp:1.6.4")
    implementation("io.ktor:ktor-client-core:1.6.4")

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

    // Redis
    implementation("org.redisson:redisson:3.16.4")

    // Haru (scheduling)
    implementation("dev.floofy.haru:Haru:1.3.0")

    // Cache (in-memory)
    implementation("com.github.ben-manes.caffeine:caffeine:3.0.4")

    // Prometheus (metrics)
    implementation("io.prometheus:simpleclient_hotspot:0.12.0")
    implementation("io.prometheus:simpleclient:0.12.0")

    // Sentry (error handling as a service :^)
    implementation("io.sentry:sentry-logback:5.4.0")
    implementation("io.sentry:sentry:5.4.0")

    // Apache Utilities
    implementation("org.apache.commons:commons-lang3:3.12.0")
}

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

application {
    mainClass.set("sh.nino.discord.Bootstrap")
    java {
        sourceCompatibility = JavaVersion.VERSION_16
        targetCompatibility = JavaVersion.VERSION_16
    }
}

tasks {
    compileKotlin {
        kotlinOptions.jvmTarget = JavaVersion.VERSION_16.toString()
        kotlinOptions.javaParameters = true
        kotlinOptions.freeCompilerArgs += listOf(
            "-Xopt-in=kotlin.RequiresOptIn"
        )
    }

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

    build {
        dependsOn("generateMetadata")
        dependsOn(spotlessApply)
        dependsOn(shadowJar)
    }
}

tasks.register("generateMetadata") {
    val path = sourceSets["main"].resources.srcDirs.first()
    if (!file(path).exists()) path.mkdirs()

    val date = Date()
    val formatter = SimpleDateFormat("MMM dd, yyyy HH:mm:ss")
    file("$path/build-info.properties").writeText("""app.build.date = ${formatter.format(date)}
app.version = ${current.string()}
app.commit  = ${current.commit()}
    """.trimIndent())
}
