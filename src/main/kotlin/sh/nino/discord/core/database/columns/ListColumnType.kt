package sh.nino.discord.core.database.columns

import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.ColumnType
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.statements.jdbc.JdbcConnectionImpl
import org.jetbrains.exposed.sql.transactions.TransactionManager

fun <T> Table.array(name: String, type: ColumnType): Column<Array<T>> = registerColumn(name, ArrayColumnType(type))
class ArrayColumnType(private val type: ColumnType): ColumnType() {
    override fun sqlType(): String = "${type.sqlType()} ARRAY"
    override fun valueToDB(value: Any?): Any? {
        if (value is Array<*>) {
            val columnType = type.sqlType().split("(")[0]
            val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection
            return connection.createArrayOf(columnType, value.toTypedArray())
        } else {
            return super.valueToDB(value)
        }
    }

    override fun valueFromDB(value: Any): Any {
        if (value is java.sql.Array) return value.array
        if (value is List<*>) return value

        error("List (Arrays) is not supported.")
    }

    override fun nonNullValueToString(value: Any): String {
        if (value is Array<*>) {
            if (value.isEmpty()) return "'{}'"

            val columnType = type.sqlType().split("(")[0]
            val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection
            return connection.createArrayOf(columnType, value) ?: error("")
        } else {
            return super.nonNullValueToString(value)
        }
    }
}
