package sh.nino.discord.extensions

import kotlinx.serialization.json.JsonPrimitive

fun String.asJson(): JsonPrimitive = JsonPrimitive(this)
fun Number.asJson(): JsonPrimitive = JsonPrimitive(this)
fun Boolean.asJson(): JsonPrimitive = JsonPrimitive(this)
