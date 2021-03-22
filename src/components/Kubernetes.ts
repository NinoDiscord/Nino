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

import { Component, Inject } from '@augu/lilith';
import { HttpClient } from '@augu/orchid';
import { Logger } from 'tslog';
import * as k8s from '@kubernetes/client-node';
import Config from './Config';

export default class K8SClient implements Component {
  private kubeConfig: k8s.KubeConfig = new k8s.KubeConfig();
  public priority: number = 1;
  public name: string = 'k8s';

  @Inject
  private logger!: Logger;

  @Inject
  private config!: Config;

  load() {
    const environment = this.config.getProperty('environment') ?? 'development';
    if (environment !== 'production')
      return;

    this.logger.info('Attempting to load kubeconfig...');
    this.kubeConfig.loadFromDefault();
  }

  async getCurrentNodes() {
    const environment = this.config.getProperty('environment') ?? 'development';
    if (environment !== 'production')
      return [];

    const api = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
    const ns = this.config.getProperty('k8s.namespace');
    if (ns === undefined)
      return [];

    const pod = await api.listNamespacedPod(ns);
    return pod.body.items.map(item => ({
      createdAt: item.metadata?.creationTimestamp !== undefined ? new Date(item.metadata?.creationTimestamp) : '[malformed date]',
      node: item.spec?.nodeName ?? '<... unknown? ...?',
      name: item.metadata?.name
    }));
  }
}
