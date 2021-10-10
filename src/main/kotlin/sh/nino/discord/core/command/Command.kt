package sh.nino.discord.core.command

import dev.kord.common.entity.Permissions
import kotlinx.coroutines.launch
import sh.nino.discord.core.NinoScope
import kotlin.reflect.KCallable
import kotlin.reflect.full.callSuspend
import sh.nino.discord.core.annotations.Command as CommandAnnotation

class Command(
    val name: String,
    val description: String,
    val category: CommandCategory = CommandCategory.CORE,
    val usage: String = "",
    val ownerOnly: Boolean = false,
    val aliases: List<String> = listOf(),
    val examples: List<String> = listOf(),
    val cooldown: Int = 5,
    val userPermissions: List<Permissions> = listOf(),
    val botPermissions: List<Permissions> = listOf(),
    private val thisCtx: Any,
    private val kMethod: KCallable<Unit>
) {
    constructor(
        info: CommandAnnotation,
        cmdKlass: Any,
        method: KCallable<Unit>
    ): this(
        info.name,
        info.description,
        info.category,
        info.usage,
        info.ownerOnly,
        info.aliases.toList(),
        info.examples.toList(),
        info.cooldown,
        info.userPermissions.map { p -> Permissions { +p } }.toList(),
        info.botPermissions.map { p -> Permissions { +p } }.toList(),
        cmdKlass,
        method
    )

    suspend fun execute(callback: (Boolean, Exception?) -> Unit) {
        if (kMethod.isSuspend) {
            NinoScope.launch {
                try {
                    kMethod.callSuspend(thisCtx)
                    callback(true, null)
                } catch(e: Exception) {
                    callback(false, e)
                }
            }
        } else {
            try {
                kMethod.call(thisCtx)
                callback(true, null)
            } catch (e: Exception) {
                callback(false, e)
            }
        }
    }
}
