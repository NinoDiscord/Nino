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

/* eslint-disable camelcase */

import { Container } from '@augu/lilith';
import { APIUser } from 'discord-api-types';
import { crypto } from '../api/encryption';

declare global {
  /** The current container running */
  var app: Container;

  namespace NodeJS {
    interface Global {
      /** The current container running */
      app: Container;
    }
  }

  interface APITokenResult extends Omit<crypto.EncryptedData, 'token'> {
    refreshToken: string;
    accessToken: string;
    expiryDate: number;
    data: APIUser;
    id: string;
  }

  interface RedisInfo {
    total_connections_received: number;
    total_commands_processed: number;
    instantaneous_ops_per_sec: number;
    total_net_input_bytes: number;
    total_net_output_bytes: number;
    instantaneous_input_kbps: number;
    instantaneous_output_kbps: number;
    rejected_connections: number;
    sync_full: number;
    sync_partial_ok: number;
    sync_partial_err: number;
    expired_keys: number;
    expired_stale_perc: number;
    expired_time_cap_reached_count: number;
    evicted_keys: number;
    keyspace_hits: number;
    keyspace_misses: number;
    pubsub_channels: number;
    pubsub_patterns: number;
    latest_fork_usec: number;
    migrate_cached_sockets: number;
    slave_expires_tracked_keys: number;
    active_defrag_hits: number;
    active_defrag_misses: number;
    active_defrag_key_hits: number;
    active_defrag_key_misses: number;
  }

  interface RedisServerInfo {
    redis_version: string;
    redis_git_sha1: string;
    redis_git_dirty: string;
    redis_build_id: string;
    redis_mode: string;
    os: string;
    arch_bits: string;
    multiplexing_api: string;
    atomicvar_api: string;
    gcc_version: string;
    process_id: string;
    process_supervised: string;
    run_id: string;
    tcp_port: string;
    server_time_usec: string;
    uptime_in_seconds: string;
    uptime_in_days: string;
    hz: string;
    configured_hz: string;
    lru_clock: string;
    executable: string;
    config_file: string;
    io_threads_active: string;
  }
}
