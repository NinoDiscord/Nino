interface JSON {
  parse<T>(text: string, reviver?: ((this: any, key: keyof T, value: T[keyof T]) => any)): T;
}