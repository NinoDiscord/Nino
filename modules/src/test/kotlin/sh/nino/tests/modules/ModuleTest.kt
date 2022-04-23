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

@file:Suppress("UNUSED")

package sh.nino.tests.modules

import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.AnnotationSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.string.shouldContain
import sh.nino.modules.Registry

class ModuleTest: AnnotationSpec() {
    private val registry: Registry = Registry()
    private val testModule = TestModule()

    @Test
    fun `dummy module should error`() {
        val dummy = DummyErrorModule()
        val exception = shouldThrow<IllegalStateException> {
            registry.register(dummy)
        }

        exception.message shouldBe "Cannot find @ModuleMeta annotation."
    }

    @Test
    fun `test module should not error when registered`() {
        val exception = shouldNotThrow<IllegalStateException> {
            registry.register(testModule)
        }

        val exception2 = shouldThrow<IllegalStateException> {
            registry.register(testModule)
        }

        exception shouldNotBe null
        exception2.message shouldContain "already registered"
    }

    @Test
    fun `getOrNull should not be null`() {
        registry.register(testModule)

        val test0 = registry[TestModule::class]
        test0 shouldNotBe null

        val test = registry.getOrNull<TestModule>()
        test shouldNotBe null
        test!!.current.test shouldBe true

        registry.unregister(TestModule::class)
    }

    @Test
    fun `readonlyproperty should work`() {
        registry.register(testModule)

        val test: TestModule by registry.inject()
        test.test shouldBe true

        registry.unregister(TestModule::class)
    }

    @Test
    fun `test module should not error when unregistering`() {
        shouldNotThrow<IllegalStateException> {
            registry.unregister(TestModule::class)
        }

        shouldThrow<IllegalStateException> {
            registry.unregister(DummyErrorModule::class)
        }
    }
}
