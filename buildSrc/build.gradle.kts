plugins {
    groovy
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
    maven("https://maven.floofy.dev/repo/releases")
}

dependencies {
    implementation(kotlin("gradle-plugin", version = "1.6.10"))
    implementation(kotlin("serialization", version = "1.6.10"))
    implementation("org.jetbrains.kotlinx:atomicfu-gradle-plugin:0.17.0")
    implementation("gay.floof.utils:gradle-utils:1.1.0")
    implementation("com.diffplug.spotless:spotless-plugin-gradle:6.2.0")
    implementation("io.kotest:kotest-gradle-plugin:0.3.9")
    implementation(gradleApi())
}
