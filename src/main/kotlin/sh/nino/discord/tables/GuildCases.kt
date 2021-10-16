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

package sh.nino.discord.tables

import org.jetbrains.exposed.sql.Table

enum class CaseType {}

object GuildCases: Table("guild_cases") {

}

/*
object Cities : Table() {
    val id = integer("id").autoIncrement() // Column<Int>
    val name = varchar("name", 50) // Column<String>

    override val primaryKey = PrimaryKey(id, name = "PK_Cities_ID")
}
 */

//
//import org.ktorm.entity.Entity
//import org.ktorm.schema.Table
//
//interface GuildCase: Entity<GuildCase> {
//    val attachments: List<String>
//    val moderatorId: String
//    val messageId: String?
//    val victimId: String
//    val guildId: String
//    val reason: String?
//    val index: Int
//}
//
//class GuildCasesTable: Table<GuildCase>(tableName = "guild_cases")
//
///*
//  @Column({
//    type: 'enum',
//    enum: PunishmentType,
//  })
//  public type!: PunishmentType;
//
//  @Column({ default: false })
//  public soft!: boolean;
//
//  @Column({ nullable: true, default: undefined, type: 'bigint' })
//  public time?: string;
// */
