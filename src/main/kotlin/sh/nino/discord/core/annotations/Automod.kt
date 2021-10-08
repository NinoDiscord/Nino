package sh.nino.discord.core.annotations

/**
 * Represents an annotation to mark a class as an Automod object.
 */
@Target(AnnotationTarget.CLASS)
annotation class Automod(
    val name: String
)
