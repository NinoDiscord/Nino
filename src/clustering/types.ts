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

/**
 * Returns the request body of inferred type `T` if any,
 * or returns `never` if `T` was never a `Request<*>` object
 * or the body was `never`.
 */
export type RequestBody<T> = T extends Request<any> ? (T['body'] extends never ? never : T['body']) : never;

/**
 * Represents a generic request to send to the operator defined [here](https://github.com/MikaBot/cluster-operator/blob/master/implementation.md#packet-structure).
 */
export interface Request<T extends {} = {}> {
  op: number;
  body?: T;
}

/**
 * Represents a [handshaking](https://github.com/MikaBot/cluster-operator/blob/master/implementation.md#handshaking) request.
 * This is only for sending, not receiving.
 */
export interface HandshakeRequest extends Request<never> {
  op: 1;
  body: never;
}

/**
 * Represents a [receive shard data](https://github.com/MikaBot/cluster-operator/blob/master/implementation.md#receiving-shard-data) request.
 * This is only for receiving, not sending.
 */
export interface ReceiveShardDataRequest extends Request<ShardDataBody> {
  op: 1;
  body: ShardDataBody;
}

export interface ShardDataBody {
  id: number;
  block: {
    shards: number[];
    total: number;
  };
}

export interface MarkClientReadyRequest extends Request<never> {
  op: 9;
  body: never;
}
