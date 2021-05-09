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

import type { Request, Response } from 'express';
import { MetadataKeys } from '../util/Constants';

export interface RouteDefinition {
  run(req: Request, res: Response): any;
  method: 'get' | 'patch' | 'put' | 'delete' | 'post';
  path: string;
}

export function Get(path: string): MethodDecorator {
  return (target: any, _, descriptor: TypedPropertyDescriptor<any>) => {
    const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, target) ?? [];
    routes.push({
      method: 'get',
      path,
      run: descriptor.value
    });

    Reflect.defineMetadata(MetadataKeys.APIRoute, routes, target);
  };
}

export function Patch(path: string): MethodDecorator {
  return (target: any, _, descriptor: TypedPropertyDescriptor<any>) => {
    const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, target) ?? [];
    routes.push({
      method: 'patch',
      path,
      run: descriptor.value
    });

    Reflect.defineMetadata(MetadataKeys.APIRoute, routes, target);
  };
}

export function Delete(path: string): MethodDecorator {
  return (target: any, _, descriptor: TypedPropertyDescriptor<any>) => {
    const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, target) ?? [];
    routes.push({
      method: 'delete',
      path,
      run: descriptor.value
    });

    Reflect.defineMetadata(MetadataKeys.APIRoute, routes, target);
  };
}

export function Put(path: string): MethodDecorator {
  return (target: any, _, descriptor: TypedPropertyDescriptor<any>) => {
    const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, target) ?? [];
    routes.push({
      method: 'put',
      path,
      run: descriptor.value
    });

    Reflect.defineMetadata(MetadataKeys.APIRoute, routes, target);
  };
}

export function Post(path: string): MethodDecorator {
  return (target: any, _, descriptor: TypedPropertyDescriptor<any>) => {
    const routes = Reflect.getMetadata<RouteDefinition[]>(MetadataKeys.APIRoute, target) ?? [];
    routes.push({
      method: 'post',
      path,
      run: descriptor.value
    });

    Reflect.defineMetadata(MetadataKeys.APIRoute, routes, target);
  };
}
