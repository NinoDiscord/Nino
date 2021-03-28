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

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { PunishmentType } from './PunishmentsEntity';

@Entity({ name: 'cases' })
export default class CaseEntity {
  @Column({ name: 'moderator_id' })
  public moderatorID!: string;

  @Column({ name: 'message_id', nullable: true, default: undefined })
  public messageID?: string;

  @Column({ name: 'victim_id' })
  public victimID!: string;

  @PrimaryColumn({ name: 'guild_id' })
  public guildID!: string;

  @Column({ nullable: true, default: undefined })
  public reason?: string;

  @PrimaryColumn()
  public index!: number;

  @Column({
    type: 'enum',
    enum: PunishmentType
  })
  public type!: PunishmentType;

  @Column({ default: false })
  public soft!: boolean;

  @Column({ nullable: true, default: undefined })
  public time?: number;
}
