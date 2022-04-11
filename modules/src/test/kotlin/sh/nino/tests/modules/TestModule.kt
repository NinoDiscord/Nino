package sh.nino.tests.modules

import sh.nino.modules.annotations.Action
import sh.nino.modules.annotations.Closeable
import sh.nino.modules.annotations.ModuleMeta

@ModuleMeta("owo", "uwu", "1.0.0", "Owo Team")
class TestModule {
    val test = true

    @Action
    fun uwu() {
        println("owo")
    }

    @Closeable
    fun close() {
        println("closed!")
    }
}
