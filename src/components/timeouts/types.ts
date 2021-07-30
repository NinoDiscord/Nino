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

import type { PunishmentType } from '../../entities/PunishmentsEntity';

/**
 * Current state of the WebSocket connection with the timeouts service
 */
export const enum SocketState {
  Connecting = 'connecting',
  Connected = 'connected',
  Unknown = 'unknown',
  Closed = 'closed',
}

/**
 * List of OPCodes to send or receive from
 */
export const enum OPCodes {
  // receive
  Ready,
  Apply,

  // send
  Request,
  Acknowledged,
}

/**
 * Represents a data packet that is sent out
 * @typeparam T  - The data packet received
 * @typeparam OP - The OPCode that this data represents
 */
export interface DataPacket<T, OP extends OPCodes = OPCodes> {
  op: OP;
  d: T;
}

export interface Timeout {
  moderator: string;
  expired: number;
  issued: number;
  reason: string | null;
  guild: string;
  user: string;
  type: PunishmentTimeoutType;
}

/**
 * Represents that the service is ready and probably has
 * incoming timeouts to take action on
 */
export type ReadyPacket = DataPacket<null, OPCodes.Ready>;

/**
 * Represents what a request to send to the service
 */
export type RequestPacket = DataPacket<Timeout, OPCodes.Request>;

/**
 * Represents the data payload when we acknowledged
 */
export type AcknowledgedPacket = DataPacket<Timeout[]>;

export type ApplyPacket = DataPacket<Timeout>;
export type PunishmentTimeoutType = Exclude<
PunishmentType,
| PunishmentType.Kick
| PunishmentType.WarningAdded
| PunishmentType.WarningRemoved
| PunishmentType.Mute
| PunishmentType.Ban
| PunishmentType.VoiceMute
| PunishmentType.VoiceDeafen
>;
