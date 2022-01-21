package sh.nino.discord.database.columns

import org.jetbrains.exposed.sql.ColumnType
import kotlin.reflect.full.isSubclassOf

@Suppress("UNCHECKED_CAST")
class CustomEnumerationColumn<T: Any>(
    private val name: String,
    private val sql: String? = null,
    private val fromDb: (Any) -> T,
    private val toDb: (T) -> Any
): ColumnType() {
    override fun sqlType(): String = sql ?: error("Column $name should exists in database ")
    override fun valueFromDB(value: Any): T = if (value::class.isSubclassOf(Enum::class)) value as T else fromDb(value)
    override fun notNullValueToDB(value: Any): Any = toDb(value as T)
}
