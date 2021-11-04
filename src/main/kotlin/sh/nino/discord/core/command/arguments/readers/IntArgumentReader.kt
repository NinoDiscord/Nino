package sh.nino.discord.core.command.arguments.readers

import sh.nino.discord.core.command.arguments.ArgumentReader
import java.util.*

class IntArgumentReader: ArgumentReader<Int>() {
    override fun parse(value: String): Optional<Int> =
        try {
            // check if we can parse it,
            // if we can't, it'll move to the `catch` block.
            Integer.parseInt(value)

            Optional.of(value.toInt())
        } catch (e: Exception) {
            Optional.empty()
        }
}
