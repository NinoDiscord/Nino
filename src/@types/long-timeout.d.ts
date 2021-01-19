// Definitions for package: "long-timeout"
// Project: https://github.com/tellnes/long-timeout
// Definitions by:
//    - August (Chris) <https://github.com/auguwu>

declare module 'long-timeout' {
  namespace LongTimeout {
    export function setTimeout(listener: (...args: any[]) => void, after: number): LongTimeout.Timeout;
    export function setInterval(listener: (...args: any[]) => void, after: number): LongTimeout.Interval;
    export function clearTimeout(timer: LongTimeout.Timeout): void;
    export function clearInterval(interval: LongTimeout.Interval): void;

    export class Timeout {
      constructor(listener: (...args: any[]) => void, after: number);

      public unreffed: boolean;
      public listener: (...args: any[]) => void;
      public after: number;

      public unref(): void;
      public start(): void;
      public close(): void;
      public ref(): void;
    }

    export class Interval {
      constructor(listener: (...args: any[]) => void, after: number);

      public unreffed: boolean;
      public listener: (...args: any[]) => void;
      public after: number;

      public unref(): void;
      public start(): void;
      public close(): void;
      public ref(): void;
    }
  }

  export = LongTimeout;
}
