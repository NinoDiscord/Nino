package sh.nino.api.plugins

import io.ktor.server.application.*
import io.ktor.server.request.*
import org.slf4j.MDC
import sh.nino.commons.extensions.ifNotNull

val UserAgentPlugin = createApplicationPlugin("NinoUserAgentPlugin") {
    onCall { c ->
        val userAgent = c.request.userAgent()
        userAgent.ifNotNull {
            MDC.put("user_agent", it)
        }
    }

    onCallReceive { _, _ ->
        MDC.remove("user_agent")
    }
}
