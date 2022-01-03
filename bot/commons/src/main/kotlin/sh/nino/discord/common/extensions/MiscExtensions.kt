package sh.nino.discord.common.extensions

/**
 * This extension creates a new [Map] of a [List] with [Pair]s.
 * ```kt
 * val owo = listOf(Pair("first", "second"), Pair("third", "fourth"))
 * owo.asMap()
 * // { "first": "second", "third": "fourth" }
 * ```
 */
fun <T, U> List<Pair<T, U>>.asMap(): Map<T, U> {
    val map = mutableMapOf<T, U>()
    for (item in this) {
        map[item.first] = item.second
    }

    return map.toMap()
}

/**
 * This extension returns a [Pair] from a list which the first item
 * is from [List.first] while the second item is a [List] of the underlying
 * data left over.
 */
fun <T> List<T>.pairUp(): Pair<T, List<T>> = Pair(first(), drop(1))
