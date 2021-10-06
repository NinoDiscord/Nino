package sh.nino.discord.core

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.asCoroutineDispatcher
import sh.nino.discord.NinoBot
import kotlin.coroutines.CoroutineContext

object NinoScope: CoroutineScope {
    private val job: Job = Job()
    override val coroutineContext: CoroutineContext = job + NinoBot.executorPool.asCoroutineDispatcher()
}
