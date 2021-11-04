package sh.nino.discord.core.command.arguments.readers

import sh.nino.discord.core.command.arguments.ArgumentReader
import java.util.*

class StringArgumentReader: ArgumentReader<String>() {
    override fun parse(value: String): Optional<String> = Optional.of(value)
}
