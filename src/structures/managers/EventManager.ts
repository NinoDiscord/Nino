import 'reflect-metadata';
import { injectable, inject, multiInject } from 'inversify';
import { readdir } from 'fs';
import { sep } from 'path';
import Bot from '../Bot';
import Event from '../Event';
import { TYPES } from '../../types';

@injectable()
export default class EventManager {
  public bot: Bot;
  public events: Event[];

  /**
   * Creates a new instance of the event manager
   * @param bot The client instance
   * @param events The events to listen to
   */
  constructor(
    @inject(TYPES.Bot) bot: Bot,
    @multiInject(TYPES.Event) events: Event[]
  ) {
    this.bot = bot;
    this.events = events;
  }

  run() {
    for (const event of this.events) this.emit(event);
  }

  /**
   * Emits the event to the `EventEmitter` from the Eris client
   * @param ev The event
   */
  emit(ev: Event) {
    const wrapper = async (...args) => {
      try {
        await ev.emit(...args);
      } catch (ex) {
        this.bot.logger.error(`Unable to run event ${ev.event}:`, ex);
      }
    };

    this.bot.logger.info(`Built event "${ev.event}"`);
    this.bot.client.on(ev.event, wrapper);
  }
}
