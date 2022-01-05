package sh.nino.discord.automod

import sh.nino.discord.automod.core.automod

val toxicityAutomod = automod {
    name = "toxicity"
    onMessage {
        true
    }
}
