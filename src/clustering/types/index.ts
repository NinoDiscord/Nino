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
 * Represents the OP type any {@link Packet} will send.
 */
export enum OPType {
  Handshaking, // client -> server
  ShardData, // server -> client
  Heartbeat, // server -> client
  HeartbeatAck, // client -> server
  Eval, // client -> server
  BroadcastEval, // client -> server
  BroadcastEvalAck, // server -> client
  Stats, // server -> client
  StatsAck, // client -> server
  Ready, // client -> server
  Entity, // client -> server
  EntityAck, // server -> client
}

/**
 * Represents a generic packet type, nothing much to it. :)
 */
export interface Packet<OP extends OPType, D = any> {
  /**
   * Returns the {@link OPType} of this packet.
   */
  type: OP;

  /**
   * Returns the payload available.
   */
  body?: D;
}

/**
 * Represents the {@link OPType.Handshaking} request packet.
 */
export type HandshakeRequest = Packet<OPType.Handshaking, never>;

/**
 * Returns the packet typefor {@link OPType.ShardData}.
 */
export type ReceiveShardDataPacket = Packet<
  OPType.ShardData,
  {
    id: number;
    block: {
      shards: number[];
      total: number;
    };
  }
>;

export type HeartbeatRequest = Packet<OPType.Heartbeat, never>;
export type HeartbeatAckPacket = Packet<OPType.HeartbeatAck, never>;
export type EvalRequest = Packet<
  OPType.Eval,
  {
    id: string;
    code: string;
  }
>;
