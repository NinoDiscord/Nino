/**
 * Copyright (c) 2019-2021 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** */
declare namespace Reflect {
  /**
   * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
   * @param metadataKey A key used to store and retrieve metadata.
   * @param target The target object on which the metadata is defined.
   * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
   * @example
   *
   *     class Example {
   *     }
   *
   *     // constructor
   *     result = Reflect.getMetadata("custom:annotation", Example);
   *
   */
  function getMetadata<T>(metadataKey: any, target: any): T;

  /**
   * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
   * @param metadataKey A key used to store and retrieve metadata.
   * @param target The target object on which the metadata is defined.
   * @param propertyKey The property key for the target.
   * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
   */
  function getMetadata<T>(
    metadataKey: any,
    target: any,
    propertyKey: string | symbol
  ): T;
}
