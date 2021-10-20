/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package sh.nino.discord.core.database.columns

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.statements.jdbc.JdbcConnectionImpl
import org.jetbrains.exposed.sql.transactions.TransactionManager

fun <T> Table.array(name: String, type: ColumnType): Column<Array<T>> = registerColumn(name, ArrayColumnType(type))
class ArrayColumnType(private val type: ColumnType): ColumnType() {
    override fun sqlType(): String = "${type.sqlType()} ARRAY"
    override fun valueToDB(value: Any?): Any? =
        if (value is Array<*>) {
            val columnType = type.sqlType().split("(")[0]
            val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection
            connection.createArrayOf(columnType, value)
        } else {
            super.valueToDB(value)
        }

    override fun valueFromDB(value: Any): Any {
        if (value is java.sql.Array) return value.array
        if (value is Array<*>) return value

        error("Arrays are not supported for PostgreSQL")
    }

    override fun notNullValueToDB(value: Any): Any {
        if (value is Array<*>) {
            if (value.isEmpty()) return "'{}'"

            val columnType = type.sqlType().split("(")[0]
            val connection = (TransactionManager.current().connection as JdbcConnectionImpl).connection
            return connection.createArrayOf(columnType, value)
        } else {
            return super.notNullValueToDB(value)
        }
    }
}

private class ContainsOp(expr1: Expression<*>, expr2: Expression<*>): ComparisonOp(expr1, expr2, "@>")
infix fun <T, S> ExpressionWithColumnType<T>.contains(array: Array<out S>): Op<Boolean> = ContainsOp(this, QueryParameter(array, columnType))
