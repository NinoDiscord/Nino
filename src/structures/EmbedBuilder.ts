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

/* eslint-disable camelcase */

import type { APIEmbedAuthor, APIEmbedField, APIEmbedFooter, APIEmbedImage, APIEmbedThumbnail } from 'discord-api-types';
import type { EmbedOptions } from 'eris';
import { omitUndefinedOrNull } from '@augu/utils';

export default class EmbedBuilder {
  public description?: string;
  public timestamp?: string | Date;
  public thumbnail?: APIEmbedThumbnail;
  public author?: APIEmbedAuthor;
  public footer?: APIEmbedFooter;
  public fields?: APIEmbedField[];
  public image?: APIEmbedImage;
  public color?: number;
  public title?: string;
  public url?: string;

  constructor(data: EmbedOptions = {}) {
    this.patch(data);
  }

  patch(data: EmbedOptions) {
    if (data.description !== undefined)
      this.description = data.description;

    if (data.thumbnail !== undefined)
      this.thumbnail = data.thumbnail;

    if (data.timestamp !== undefined)
      this.timestamp = data.timestamp;

    if (data.author !== undefined)
      this.author = data.author;

    if (data.fields !== undefined)
      this.fields = data.fields;

    if (data.image !== undefined)
      this.image = data.image;

    if (data.color !== undefined)
      this.color = data.color;

    if (data.title !== undefined)
      this.title = data.title;

    if (data.url !== undefined)
      this.url = data.url;
  }

  setDescription(description: string | string[]) {
    this.description = Array.isArray(description) ? description.join('\n') : description;
    return this;
  }

  setTimestamp(stamp: Date | number = new Date()) {
    let timestamp!: number;

    if (stamp instanceof Date)
      timestamp = stamp.getTime();
    else if (typeof stamp === 'number')
      timestamp = stamp;

    this.timestamp = String(timestamp);
    return this;
  }

  setThumbnail(thumb: string) {
    this.thumbnail = { url: thumb };
    return this;
  }

  setAuthor(name: string, url?: string, iconUrl?: string) {
    this.author = { name, url, icon_url: iconUrl };
    return this;
  }

  addField(name: string, value: string, inline: boolean = false) {
    if (this.fields === undefined) this.fields = [];
    if (this.fields.length > 25) throw new RangeError('Maximum amount of fields reached.');

    this.fields.push({ name, value, inline });
    return this;
  }

  addBlankField(inline: boolean = false) {
    return this.addField('\u200b', '\u200b', inline);
  }

  addFields(fields: APIEmbedField[]) {
    for (let i = 0; i < fields.length; i++) this.addField(fields[i].name, fields[i].value, fields[i].inline);

    return this;
  }

  setColor(color: string | number | [r: number, g: number, b: number] | 'random' | 'default') {
    if (typeof color === 'number') {
      this.color = color;
      return this;
    }

    if (typeof color === 'string') {
      if (color === 'default') {
        this.color = 0;
        return this;
      }

      if (color === 'random') {
        this.color = Math.floor(Math.random() * (0xFFFFFF + 1));
        return this;
      }

      const int = parseInt(color.replace('#', ''), 16);

      this.color = (int << 16) + (int << 8) + int;
      return this;
    }

    if (Array.isArray(color)) {
      if (color.length > 2) throw new RangeError('RGB value cannot exceed to 3 or more elements');

      const [r, g, b] = color;
      this.color = (r << 16) + (g << 8) + b;

      return this;
    }

    throw new TypeError(`'color' argument was not a hexadecimal, number, RGB value, 'random', or 'default' (${typeof color})`);
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
  }

  setImage(url: string) {
    this.image = { url };
    return this;
  }

  setFooter(text: string, iconUrl?: string) {
    this.footer = { text, icon_url: iconUrl };
    return this;
  }

  build() {
    return omitUndefinedOrNull<EmbedOptions>({
      description: this.description,
      thumbnail: this.thumbnail,
      timestamp: this.timestamp,
      author: this.author ? {
        name: this.author.name!,
        url: this.author.url,
        icon_url: this.author.icon_url
      } : undefined,
      fields: this.fields,
      image: this.image,
      color: this.color,
      title: this.title,
      url: this.url
    });
  }
}
