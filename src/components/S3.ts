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

import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Component, ComponentAPI, Inject } from '@augu/lilith';
import type { Provider, Credentials } from '@aws-sdk/types';
import CommandService from '../services/CommandService';
import { Logger } from 'tslog';
import Config from './Config';

@Component({
  priority: 0,
  name: 'util:s3',
})
export default class S3 {
  public client?: S3Client;
  public api!: ComponentAPI;

  @Inject
  private readonly logger!: Logger;

  @Inject
  private readonly config!: Config;

  private get credentialsProvider(): Provider<Credentials> {
    return () =>
      new Promise((resolve) =>
        resolve({
          accessKeyId: this.config.getProperty('s3')?.accessKey!,
          secretAccessKey: this.config.getProperty('s3')?.secretKey!,
        })
      );
  }

  async load() {
    const s3 = this.config.getProperty('s3');
    if (s3 === undefined) {
      this.logger.warn(
        "S3 client credentials are not provided but this is fine, it isn't needed."
      );
      return Promise.resolve();
    }

    this.logger.info('Creating S3 client...');
    this.client = new S3Client({
      credentialDefaultProvider: () => this.credentialsProvider.bind(this),
      endpoint: 'https://s3.wasabisys.com',
      region: s3.region ?? 'us-east-1',
    });

    this.logger.info(
      `Created S3 client on region ${s3.region ?? 'us-east-1'}.`
    );
    const buckets = await this.client.send(new ListBucketsCommand({}));

    if (!buckets.Buckets) {
      this.logger.warn(
        'Unable to retrieve buckets from S3, do you have the list buckets permission?'
      );
      this.client = undefined; // set it as undefined

      return Promise.resolve();
    }

    this.logger.info(
      `S3 authentication was successful, retrieved ${
        buckets.Buckets!.length
      } buckets.`
    );
    if (
      !buckets.Buckets!.find(
        (s) => s.Name !== undefined && s.Name === s3.bucket
      )
    ) {
      this.logger.info(
        `Bucket with name ${s3.bucket} was not found, creating...`
      );
      try {
        await this.client.send(
          new CreateBucketCommand({
            Bucket: s3.bucket,
          })
        );

        this.logger.info('created bucket');
      } catch (ex) {
        this.logger.warn('error occured but thats fine :p, i think?');
        this.logger.error(ex);
      }
    }
  }

  async publishCommands() {
    if (!this.client) return Promise.resolve();

    const commands = this.api.getReference<CommandService>(CommandService);
    this.logger.info(`Serializing and uploading ${commands.size} commands...`);

    const obj: Record<string, any> = {};
    for (const command of commands.filter((s) => !s.ownerOnly).values()) {
      obj[command.name] = {
        userPermissions: command.userPermissions,
        botPermissions: command.botPermissions,
        description: command.description,
        examples: command.examples,
        category: command.category,
        cooldown: command.cooldown,
        aliases: command.aliases,
        usage: command.usage,
      };
    }

    const packet = JSON.stringify(obj);
    await this.client!.send(
      new PutObjectCommand({
        ContentLength: packet.length,
        ContentType: 'application/json',
        Bucket: this.config.getProperty('s3')!.bucket,
        Body: packet,
        Key: 'commands.json',
        ACL: 'public-read',
      })
    );
  }
}
