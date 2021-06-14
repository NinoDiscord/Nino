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
  @Field(() => [String], {
    description: 'Lists off the permissions required by the executor'
  })
  public userPermissions!: PermissionField[];

  @Field(() => [String], {
    description: 'Lists off the permissions required by the bot.'
  })
  public botPermissions!: PermissionField[];

  @Field(() => String, {
    description: 'Returns the description of the command'
  })
  public description!: ObjectKeysWithSeperator<LocalizationStrings>;

  @Field({
    description: 'If the command is owner only or not (shouldn\'t be accessable but whatever)'
  })
  public ownerOnly!: boolean;

  @Field(() => [String], {
    description: 'List of examples on how to execute the command'
  })
  public examples!: string[];

  @Field(() => Categories, {
    description: 'Identifier of the category this command belongs in'
  })
  public category!: Categories;

  @Field({
    description: 'How long you can execute this command'
  })
  public cooldown!: number;

  @Field(() => [String], {
    description: 'Additional aliases you can execute the command after the bot prefix.'
  })
  public aliases!: string[];

  @Field({
    description: 'The command\'s usage, run `x!help usage` or visit the usage section in the wiki or website for more context.'
  })
  public usage!: string;

  @Field({
    description: 'Identifier of the command name'
  })
  public name!: string;
}
