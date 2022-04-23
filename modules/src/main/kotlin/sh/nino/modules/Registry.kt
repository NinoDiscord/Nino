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

package sh.nino.modules

import gay.floof.utils.slf4j.logging
import kotlinx.coroutines.runBlocking
import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.Closeable
import sh.nino.modules.annotations.ModuleMeta
import kotlin.properties.ReadOnlyProperty
import kotlin.reflect.KClass
import kotlin.reflect.KProperty
import kotlin.reflect.full.callSuspend
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.hasAnnotation

/**
 * Represents the module registry that is implemented to register core
 * modules like the Scripting, Punishments, Timeouts, and Localisation modules.
 */
class Registry {
    // Returns a list of modules that were registered,
    // mapped by their KClass -> Module.
    val modules = mutableMapOf<KClass<*>, Module<*>>()
    val log by logging<Registry>()

    init {
        CURRENT = this
    }

    /**
     * Retrieves the module by the reified [T] generic, or `null` if the module
     * hasn't been registered.
     *
     * ## Example
     * ```kotlin
     * val registry = Registry()
     * registry.register(MyModule())
     *
     * val mod = registry.getOrNull<MyModule>() // => Module<MyModule>
     * mod?.current // => MyModule?
     * ```
     */
    @Suppress("UNCHECKED_CAST")
    inline fun <reified T: Any> getOrNull(): Module<T>? = modules[T::class] as Module<T>?

    /**
     * Operator to retrieve a [Module] from the correspondent KClass provided.
     * ## Example
     * ```kotlin
     * val registry = Registry()
     * registry.register(MyModule())
     *
     * registry[MyModule::class] // => MyModule (not null)
     * ```
     *
     * @param kClass The class to get the module from.
     * @return The [Module] registered.
     * @throws IllegalStateException If the module was not registered by [Registry.register].
     */
    operator fun get(kClass: KClass<*>): Module<*> = modules[kClass] ?: error("Module with KClass '$kClass' was not registered.")

    /**
     * Returns a [ReadOnlyProperty] of the module registered as [T], as the correspondent class
     * that was registered with it. If you want to module itself, it implements a [ReadOnlyProperty]
     * by default.
     *
     * ## Example
     * ```kotlin
     * val registry = Registry()
     * registry.register(MyModule())
     *
     * val mod by registry.inject<MyModule>()
     * // => MyModule?
     *
     * val mod2: MyModule by registry.inject()
     * // => MyModule?
     *
     * val mod3: Module<MyModule> by registry[MyModule::class]
     * // => Module<MyModule>
     * ```
     */
    inline fun <reified T: Any> inject(): ReadOnlyProperty<Any?, T?> = ReadOnlyProperty { _, _ ->
        if (modules.containsKey(T::class))
            return@ReadOnlyProperty this[T::class].current as T

        null
    }

    /**
     * Registers a module to the registry.
     * @param module The module to register
     * @throws IllegalStateException If the module was already registered.
     */
    inline fun <reified T: Any> register(module: T) {
        log.debug("Registering module $module...")

        if (modules.containsKey(module::class))
            throw IllegalStateException("Module with KClass ${module::class} was already registered.")

        // Check if we have a `ModuleMeta` annotation register
        val meta = module::class.findAnnotation<ModuleMeta>() ?: error("Cannot find @ModuleMeta annotation.")
        val action = module::class.members.firstOrNull { it.hasAnnotation<Action>() }
        val closable = module::class.members.firstOrNull { it.hasAnnotation<Closeable>() }

        // Create a module object
        val mod = object: Module<T> {
            /**
             * Returns the value of the property for the given object.
             * @param thisRef the object for which the value is requested.
             * @param property the metadata for the property.
             * @return the property value.
             */
            override fun getValue(thisRef: Any?, property: KProperty<*>): T = this.current

            /** The name of the module. */
            override val name: String = meta.name

            /** The current version of this module */
            override val version: String = meta.version

            /** Short description on what this module is. */
            override val description: String = meta.description

            /** The author who made this module. */
            override val author: String = meta.author

            /** The subclass that this module was registered by. */
            override val current: T = module

            /**
             * The method to initialize this module, which can be represented
             * as the [Action][sh.nino.modules.annotations.Action] annotation.
             */
            override fun init() {
                if (action != null && action.isSuspend) {
                    runBlocking {
                        action.callSuspend(module)
                    }
                } else {
                    action?.call(module)
                }
            }

            /**
             * Closes this resource, relinquishing any underlying resources.
             * This method is invoked automatically on objects managed by the
             * `try`-with-resources statement.
             *
             * @apiNote
             * While this interface method is declared to throw `Exception`, implementers are *strongly* encouraged to
             * declare concrete implementations of the `close` method to
             * throw more specific exceptions, or to throw no exception at all
             * if the close operation cannot fail.
             *
             *
             *  Cases where the close operation may fail require careful
             * attention by implementers. It is strongly advised to relinquish
             * the underlying resources and to internally *mark* the
             * resource as closed, prior to throwing the exception. The `close` method is unlikely to be invoked more than once and so
             * this ensures that the resources are released in a timely manner.
             * Furthermore it reduces problems that could arise when the resource
             * wraps, or is wrapped, by another resource.
             *
             *
             * *Implementers of this interface are also strongly advised
             * to not have the `close` method throw [ ].*
             *
             * This exception interacts with a thread's interrupted status,
             * and runtime misbehavior is likely to occur if an `InterruptedException` is [ suppressed][Throwable.addSuppressed].
             *
             * More generally, if it would cause problems for an
             * exception to be suppressed, the `AutoCloseable.close`
             * method should not throw it.
             *
             *
             * Note that unlike the [close][java.io.Closeable.close]
             * method of [java.io.Closeable], this `close` method
             * is *not* required to be idempotent.  In other words,
             * calling this `close` method more than once may have some
             * visible side effect, unlike `Closeable.close` which is
             * required to have no effect if called more than once.
             *
             * However, implementers of this interface are strongly encouraged
             * to make their `close` methods idempotent.
             *
             * @throws Exception if this resource cannot be closed
             */
            override fun close() {
                if (closable != null && closable.isSuspend)
                    throw IllegalStateException("@Closeable method cannot be suspended.")

                closable?.call(module)
            }
        }

        modules[module::class] = mod
        mod.init()

        log.debug("Registered module ${mod.name} by ${mod.author}")
    }

    fun <T: KClass<*>> unregister(module: T) {
        if (!modules.containsKey(module))
            throw IllegalStateException("Module $module was not registered.")

        val mod = modules[module]!!
        mod.close()

        modules.remove(module)
    }

    fun unregisterAll() {
        for (module in modules.values) {
            module.close()
        }
    }

    companion object {
        var CURRENT: Registry? = null

        inline fun <reified T: Any> inject() = CURRENT?.inject<T>() ?: error("Registry wasn't initialized properly.")
    }
}
