// Since mostly the code isn't mine, I will not license this file under Noelware.
// All credits goes to ravy! <3

import { join } from 'path';
import Module from 'module';

/**
 * Patches the `require` function to support module aliases. This function
 * is from [@aero/require](https://ravy.dev/aero/forks/require) by ravy but modified:
 *
 * - Add `@/*` for the root directory (in this case, it'll be `build/`)
 * - Modify `~/*` for the src/ directory
 *
 * All credits belong to ravy!
 */
const requirePatch = () => {
  Module.prototype.require = new Proxy(Module.prototype.require, {
    apply(target, thisArg, args) {
      const name = args[0];
      if (name.startsWith('~/')) {
        const path = name.split('/').slice(1);
        args[0] = join(process.cwd(), ...path);
      }

      if (name.startsWith('@/')) {
        const path = name.split('/').slice(1);
        args[0] = join(process.cwd(), '..', ...path);
      }

      return Reflect.apply(target, thisArg, args);
    },
  });
};

requirePatch();
