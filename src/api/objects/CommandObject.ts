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

import { ObjectType, Field, registerEnumType } from 'type-graphql';
import type { PermissionField } from '../../structures/Command';
import { Categories } from '../../util/Constants';

registerEnumType(Categories, {
  name: 'CommandCategory',
  description: 'The category of a specific command'
});

@ObjectType()
export class CommandObject {
  @Field(() => [String])
  public userPermissions!: PermissionField[];

  @Field(() => [String])
  public botPermissions!: PermissionField[];

  @Field(() => String)
  public description!: ObjectKeysWithSeperator<LocalizationStrings>;

  @Field()
  public ownerOnly!: boolean;

  @Field(() => [String])
  public examples!: string[];

  @Field(() => Categories)
  public category!: Categories;

  @Field()
  public cooldown!: number;

  @Field(() => [String])
  public aliases!: string[];

  @Field()
  public usage!: string;

  @Field()
  public name!: string;
}
