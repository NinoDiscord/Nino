const SYMBOL = Symbol('$params');

export function Parameter(type: any) {
  return (target: any, prop: string | symbol, index: number) => {
    const existing = Reflect.getOwnMetadata(SYMBOL, target, prop) || [];
    existing.push(index);

    Reflect.defineMetadata(SYMBOL, existing, target, prop);
  };
}