package sh.nino.discord.core.koin

import org.koin.core.logger.Level
import org.koin.core.logger.Logger
import org.koin.core.logger.MESSAGE
import sh.nino.discord.kotlin.logging

object NinoKoinLogger: Logger(Level.DEBUG) {
    private val logger by logging<NinoKoinLogger>()

    override fun log(level: Level, msg: MESSAGE) {
        if (this.level < level) {
            when (this.level) {
                Level.DEBUG -> logger.debug(msg)
                Level.INFO -> logger.info(msg)
                Level.ERROR -> logger.error(msg)
                else -> {
                    // skip
                }
            }
        }
    }
}
