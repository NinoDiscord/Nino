package sh.nino.discord.core.database.tables.dao

import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IdTable
import org.jetbrains.exposed.sql.Column

/**
 * Represents a [Table] but uses a [Snowflake] as the primary key.
 */
open class SnowflakeTable(name: String = ""): IdTable<Long>(name) {
    override var id: Column<EntityID<Long>> = long("id").entityId()
    override val primaryKey: PrimaryKey = PrimaryKey(id, name = "PK${if (name.isNotEmpty()) "_$name" else ""}_ID")
}
