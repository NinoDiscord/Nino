/*
 * 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
 * Copyright (c) 2019-2022 Nino Team
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

package sh.nino.database.columns

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.statements.jdbc.JdbcConnectionImpl
import org.jetbrains.exposed.sql.transactions.TransactionManager
import org.postgresql.jdbc.PgArray

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

    @Suppress("UNCHECKED_CAST")
    override fun valueFromDB(value: Any): Array<*> {
        if (value is PgArray) {
            return if (type.sqlType().endsWith("Enum")) {
                (value.array as Array<*>).filterNotNull().map {
                    type.valueFromDB(it)
                }.toTypedArray()
            } else {
                value.array as Array<*>
            }
        }

        if (value is java.sql.Array) {
            return if (type.sqlType().endsWith("Enum")) {
                (value.array as Array<*>).filterNotNull().map {
                    type.valueFromDB(it)
                }.toTypedArray()
            } else {
                value.array as Array<*>
            }
        }

        if (value is Array<*>) return value

        error("Unable to return an Array from a non-array value. ($value, ${value::class})")
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
infix fun <T, S> ExpressionWithColumnType<T>.contains(array: Array<in S>): Op<Boolean> = ContainsOp(this, QueryParameter(array, columnType))

class AnyOp(val expr1: Expression<*>, val expr2: Expression<*>): Op<Boolean>() {
    override fun toQueryBuilder(queryBuilder: QueryBuilder) {
        if (expr2 is OrOp) {
            queryBuilder.append("(").append(expr2).append(")")
        } else {
            queryBuilder.append(expr2)
        }

        queryBuilder.append(" = ANY (")
        if (expr1 is OrOp) {
            queryBuilder.append("(").append(expr1).append(")")
        } else {
            queryBuilder.append(expr1)
        }

        queryBuilder.append(")")
    }
}

infix fun <T, S> ExpressionWithColumnType<T>.any(v: S): Op<Boolean> = if (v == null) {
    IsNullOp(this)
} else {
    AnyOp(this, QueryParameter(v, columnType))
}
