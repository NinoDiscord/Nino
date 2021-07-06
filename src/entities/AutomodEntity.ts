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

@Entity({ name: 'automod' })
export default class AutomodEntity {
  @Column({ array: true, type: 'text', name: 'whitelist_channels_during_raid', default: '{}' })
  public whitelistChannelsDuringRaid!: string[];

  @Column({ array: true, type: 'text', name: 'blacklist_words', default: '{}' })
  public blacklistWords!: string[];

  @Column({ default: false, name: 'short_links' })
  public shortLinks!: boolean;

  @Column({ default: false })
  public blacklist!: boolean;

  @Column({ default: false })
  public mentions!: boolean;

  @Column({ default: false })
  public invites!: boolean;

  @Column({ default: false })
  public dehoist!: boolean;

  @PrimaryColumn({ name: 'guild_id' })
  public guildID!: string;

  @Column({ default: false })
  public spam!: boolean;

  @Column({ default: false })
  public raid!: boolean;
}
