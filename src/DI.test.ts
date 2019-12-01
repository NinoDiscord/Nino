import container from './inversify.config';
import Bot from './structures/Bot';

test('Dependency Injection resolves', () => {
  expect(container.resolve(Bot)).toBeDefined();
});
