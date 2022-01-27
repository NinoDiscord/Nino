import gay.floof.gradle.utils.noel
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    id("com.diffplug.spotless")
    id("io.kotest")
    id("kotlinx-atomicfu")
}

group = "sh.nino.bot"
version = if (project.version != "unspecified") project.version else "$current"

repositories {
    mavenCentral()
    mavenLocal()
    noel()
}

dependencies {
    // Testing utilities
    testImplementation(platform("io.kotest:kotest-bom:5.0.3"))
    testImplementation("io.kotest:kotest-runner-junit5")
    testImplementation("io.kotest:kotest-assertions-core")
    testImplementation("io.kotest:kotest-property")
    // do not link :bot:commons to the project itself
    if (name != "commons") {
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
            .userData(
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
            jvmTarget = JavaVersion.VERSION_17.toString()
            javaParameters = true
            freeCompilerArgs += listOf("-Xopt-in=kotlin.RequiresOptIn")
        }
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
}
