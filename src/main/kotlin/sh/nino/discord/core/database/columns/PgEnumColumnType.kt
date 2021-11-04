package sh.nino.discord.core.database.columns

import org.postgresql.util.PGobject

class PgEnumColumnType<T: Enum<T>>(enumTypeName: String, enumValue: T?): PGobject() {
    init {
        value = enumValue?.name
        type = enumTypeName
    }
}
