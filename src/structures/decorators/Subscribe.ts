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

import { MetadataKeys } from '../../util/Constants';

interface Subscription {
  run(...args: any[]): Promise<any>;
  event: string;
}

export const getSubscriptionsIn = (target: any) => Reflect.getMetadata<Subscription[]>(MetadataKeys.Subscribe, target) ?? [];
export default function Subscribe(event: string): MethodDecorator {
  return (target, _, descriptor: TypedPropertyDescriptor<any>) => {
    const subscriptions = getSubscriptionsIn(target);
    subscriptions.push({
      event,
      run: descriptor.value!
    });

    Reflect.defineMetadata(MetadataKeys.Subscribe, subscriptions, target);
  };
}
