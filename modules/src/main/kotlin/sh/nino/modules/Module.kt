package sh.nino.modules

import kotlin.properties.ReadOnlyProperty

/**
 * Represents a module that is registered from the [registry][Registry].
 */
interface Module<T: Any>: AutoCloseable, ReadOnlyProperty<Any?, T> {
    /** The name of the module. */
    val name: String

    /** The current version of this module */
    val version: String

    /** Short description on what this module is. */
    val description: String

    /** The author who made this module. */
    val author: String

    /** The subclass that this module was registered by. */
    val current: T

    /**
     * The method to initialize this module, which can be represented
     * as the [Action][sh.nino.modules.annotations.Action] annotation.
     */
    fun init()
}
