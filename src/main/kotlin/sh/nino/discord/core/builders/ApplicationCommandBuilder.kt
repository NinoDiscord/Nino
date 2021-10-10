package sh.nino.discord.core.builders

import sh.nino.discord.core.annotations.NinoDslMarker

/**
 * Represents a builder object to construct slash commands. Since annotations
 * don't cut it with dynamic data.
 */
@NinoDslMarker
class ApplicationCommandBuilder {
    var description: String = ""
    var name: String = ""
}
