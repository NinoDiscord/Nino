package sh.nino.discord.core.database.entities

import dev.kord.common.entity.Snowflake
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IdTable

abstract class SnowflakeEntity(id: EntityID<Snowflake>): Entity<Snowflake>(id)
abstract class SnowflakeEntityClass<out E: SnowflakeEntity>(
    table: IdTable<Snowflake>,
    entityType: Class<E>? = null
): EntityClass<Snowflake, E>(table, entityType)
