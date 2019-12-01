import { EmbedOptions } from 'eris';

export interface Embed {
  title?: string;
  description?: string;
  image?: EmbedImage;
  author?: EmbedAuthor;
  thumbnail?: EmbedThumbnail;
  fields?: EmbedField[];
  timestamp?: Date;
  footer?: EmbedFooter;
  color?: number;
  type?: 'rich';
  url?: string;
}

export type EmbedAuthor = {
  name: string;
  url?: string;
  icon_url?: string;
};

export type EmbedThumbnail = {
  url?: string;
};

export type EmbedImage = {
  url?: string;
};

export type EmbedField = {
  name?: string;
  value?: string;
  inline?: boolean;
};

export type EmbedFooter = {
  text: string;
  icon_url?: string;
};

export type StringResolvable = string | string[];

export function toString(str: StringResolvable): string {
  if (str instanceof Array) return str.join('\n');
  if (typeof str === 'string') return str;
  return String(str);
}

export function clone(obj: object) {
  const object = Object.create(obj);
  return Object.assign(obj, object);
}

export default class EmbedBuilder {
  public title: string | undefined;
  public description: string | undefined;
  public author: EmbedAuthor | undefined;
  public thumbnail: EmbedThumbnail | undefined;
  public image: EmbedImage | undefined;
  public footer: EmbedFooter | undefined;
  public color: number | undefined;
  public fields: EmbedField[] | undefined;
  public timestamp: Date | undefined;
  public url: string | undefined;

  constructor(data: Embed = {}) {
    this.title = data.title;
    this.description = data.description;
    this.author = data.author;
    this.thumbnail = data.thumbnail;
    this.image = data.image;
    this.footer = data.footer;
    this.color = data.color;
    this.fields = data.fields ? data.fields.map(clone) : [];
    this.timestamp = data.timestamp;
    this.url = data.url;
  }

  setColor(color: number) {
    this.color = color;
    return this;
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setDescription(text: string) {
    this.description = toString(text);
    return this;
  }

  setAuthor(name: string, url?: string, iconURL?: string) {
    this.author = {
      name,
      url,
      icon_url: iconURL,
    };

    return this;
  }

  setThumbnail(url: string) {
    this.thumbnail = { url };
    return this;
  }

  addField(name: string, value: string, inline: boolean = false) {
    if (!name)
      throw new Error("You d-didn't set a name to the field you baka!!");
    if (!value)
      throw new Error("You d-didn't set a value to the field you baka!!");
    if (this.fields!.length > 25)
      throw new Error('Unable to add anymore fields. (FIELD_LIMIT_THRESHOLD)');

    this.fields!.push({ name, value: toString(value), inline });
    return this;
  }

  setImage(url: string) {
    this.image = { url };
    return this;
  }

  setTimestamp(t: Date = new Date()) {
    this.timestamp = t;
    return this;
  }

  setFooter(txt: string, iconURL?: string) {
    this.footer = { text: txt, icon_url: iconURL };
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
  }

  build(): EmbedOptions {
    return {
      title: this.title,
      description: this.description,
      type: 'rich',
      fields: this.fields,
      author: this.author
        ? {
            name: this.author.name,
            url: this.author.url,
            icon_url: this.author.icon_url,
            proxy_icon_url: this.author.icon_url,
          }
        : undefined,
      image: this.image ? this.image : undefined,
      footer: this.footer
        ? {
            text: this.footer.text,
            icon_url: this.footer.icon_url,
            proxy_icon_url: this.footer.icon_url,
          }
        : undefined,
      color: this.color,
      url: this.url ? this.url : undefined,
      timestamp: this.timestamp ? this.timestamp.toISOString() : undefined,
    };
  }
}
