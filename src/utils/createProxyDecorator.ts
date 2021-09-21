// Credit: https://github.com/skyra-project/decorators/blob/main/src/utils.ts#L92
export function createProxyDecorator<T extends object>(target: T, handler: Omit<ProxyHandler<T>, 'get'>) {
  return new Proxy(target, {
    ...handler,
    get(target, property) {
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? (...args: unknown[]) => value.call(target, ...args) : value;
    },
  });
}
