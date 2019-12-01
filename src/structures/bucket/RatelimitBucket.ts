import { Collection } from '@augu/immutable';
import { User } from 'eris';
import Command from '../Command';

export default class RatelimitBucket extends Collection<Collection<number>> {
  constructor() {
    super('ratelimits');
  }

  /**
   * Initializes the bucket for a command
   * @param command The command
   */
  initialize(command: Command) {
    if (!this.has(command.name))
      this.set(command.name, new Collection(`ratelimits:${command.name}`));
    return this;
  }

  /**
   * Checks the bucket
   * @param command The command
   * @param user The user
   * @param cb The callback
   */
  check(command: Command, user: User, cb: (left: string) => void) {
    const ratelimits = this.get(command.name)!;
    const throttle = (command.cooldown || 5) * 1000;
    const now = Date.now();

    if (!ratelimits.has(user.id)) {
      ratelimits.set(user.id, now);
      setTimeout(() => ratelimits.delete(user.id), throttle);
    } else {
      const time = ratelimits.get(user.id)!;
      if (now < time) {
        const left = (time - now) / 1000;
        cb(left > 1 ? `${left.toFixed()} seconds` : `${left.toFixed()} second`);
      }

      ratelimits.set(user.id, now);
      setTimeout(() => ratelimits.delete(user.id), throttle);
    }
  }
}
