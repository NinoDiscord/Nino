import { readdirSync } from 'fs';
import { Collection } from '@augu/immutable';
import Language from '../Language';
import { sep } from 'path';
import Bot from '../Bot';
import 'reflect-metadata';

export default class LocalizationManager extends Collection<Language> {
  public bot: Bot;
  constructor(bot: Bot) {
    super();

    this.bot = bot;
  }

  addLanguage(locale: Language) {
    this.set(locale.code, locale);
  }

  run() {
    const files = readdirSync(`${process.cwd()}${sep}locales`);
    if (!files.length) return this.bot.logger.info('Couldn\'t find any localization files!');
    
    for (const file of files) {
      if (!file.endsWith('.json')) {
        this.bot.logger.warn(`Localization file ${file} doesn't end with .json!`);
        continue;
      }

      const lang = require(`${process.cwd()}${sep}locales${sep}${file}`);
      this.bot.logger.info(`Found language ${lang.code}!`);
      const locale = new Language(lang);
      this.addLanguage(locale);
    }
  }

  getLocale(code: string) {
    return this.find(x => x.code === code || x.aliases.includes(code));
  }
}
