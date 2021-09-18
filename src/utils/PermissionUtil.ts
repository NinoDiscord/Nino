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

import { Constants, Role, Member, Permission } from 'eris';

/**
 * Contains utility functions to help with permission checking and hierarchy.
 */
export default class PermissionUtil {
  /**
   * Returns the highest role the member has, `undefined` if none was found.
   * @param member The member to check
   */
  static getTopRole(member: Member) {
    // eris why
    if (member === undefined || member === null) return;

    // For some reason, `roles` will become undefined? So we have to check for that.
    // It could be a bug in Discord or `member` is undefined.
    if (member.roles === undefined) return;

    if (member.roles.length === 0) return;

    return member.roles
      .map((roleID) => member.guild.roles.get(roleID))
      .filter((role) => role !== undefined)
      .sort((a, b) => b!.position - a!.position)[0];
  }

  /**
   * Checks if role A is above role B in hierarchy (vice-versa)
   * @param a The role that should be higher
   * @param b The role that should be lower
   */
  static isRoleAbove(a?: Role, b?: Role) {
    if (!a) return false;
    if (!b) return true;

    return a.position > b.position;
  }

  /**
   * Checks if member A is above member B in hierarchy (vice-versa)
   * @param a The member that should be higher
   * @param b The member that should be lower
   */
  static isMemberAbove(a: Member, b: Member) {
    const topRoleA = this.getTopRole(a);
    const topRoleB = this.getTopRole(b);

    return this.isRoleAbove(topRoleA, topRoleB);
  }

  /**
   * Shows a string representation of all of the permissions
   * @param bits The permission bitfield
   */
  static stringify(permission: bigint) {
    const permissions = new Permission(permission, 0).json;
    const names: string[] = [];

    for (const key of Object.keys(Constants.Permissions)) {
      if (permissions.hasOwnProperty(key)) names.push(key);
    }

    return names.join(', ');
  }

  /**
   * Returns if the user's bitfield reaches the threshold of the [required] bitfield.
   * @param user The user permission bitfield
   * @param required The required permission bitfield
   */
  static overlaps(user: number, required: number) {
    return (user & 8) !== 0 || (user & required) === required;
  }
}
