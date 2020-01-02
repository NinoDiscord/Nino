import container from './inversify.config';
import Bot from './structures/Bot';

test('Container "bot" resolves', () =>
  expect(container.resolve(Bot)).toBeDefined());
