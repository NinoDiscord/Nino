package sh.nino.modules.annotations

/**
 * Represents the metadata of this specific module.
 * @param name The name of the module.
 * @param description Short description of what this module is for.
 * @param version The current version of the module.
 * @param author The author of the module.
 */
@Target(AnnotationTarget.CLASS)
annotation class ModuleMeta(
    val name: String,
    val description: String = "This module has no description.",
    val version: String = "1.0.0",
    val author: String = "Nino Team"
)
