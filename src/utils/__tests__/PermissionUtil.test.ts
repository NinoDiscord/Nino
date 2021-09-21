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

import { Client, Member, Role, Guild, Constants } from 'eris';
import { gitCommitHash } from '../Constants';
import PermissionUtil from '../PermissionUtil';

describe('Nino > PermissionUtil', () => {
  let mockMember!: Member;
  let mockRole!: Role;
  let mockGuild!: Guild;
  let mockClient!: Client;

  // @ts-ignore
  beforeAll(() => {
    mockClient = new Client(process.env.TEST_DISCORD_TOKEN!, {
      getAllUsers: true,
      intents: ['guilds', 'guildBans', 'guildMembers'],
    });

    return new Promise<void>(async (resolve) => {
      await mockClient.connect();
      mockClient.once('ready', () => {
        mockGuild = mockClient.guilds.get('382725233695522816')!;
        mockMember = mockGuild.members.get('280158289667555328')!;
        mockRole = mockGuild.roles.get('476914701863747586')!;

        mockClient.editStatus('dnd', [
          {
            name: `🧪 which unit test is successful~ [commit ${gitCommitHash}]`,
            type: 5,
          },
        ]);

        resolve();
      });
    });
  });

  afterAll(() => {
    mockClient.disconnect({ reconnect: false });
  });

  it('should return `undefined` if `member` is null or undefined', () => {
    expect(PermissionUtil.getTopRole(null as any)).toBeUndefined();
    expect(PermissionUtil.getTopRole(undefined as any)).toBeUndefined();
  });

  it('should return the "cute polar dog" role as the top role', () => {
    expect(PermissionUtil.getTopRole(mockMember)).toStrictEqual(mockRole);
  });

  it('should return `false` if `Members` is higher than `Staff`', () => {
    expect(
      PermissionUtil.isRoleAbove(mockGuild.roles.get('852993128322826261'), mockGuild.roles.get('852997744540516394'))
    ).toBeFalsy();
  });

  it('should return `true` if `Staff` is higher than `Members`', () =>
    expect(
      PermissionUtil.isRoleAbove(mockGuild.roles.get('852997744540516394'), mockGuild.roles.get('852993128322826261'))
    ).toBeTruthy());

  it('should return `false` if Polarboi is higher than Noel', () =>
    expect(
      PermissionUtil.isMemberAbove(
        mockGuild.members.get('743701282790834247')!,
        mockGuild.members.get('280158289667555328')!
      )
    ).toBeFalsy());

  it('should return `true` if Polarboi is not higher than Noel', () =>
    expect(
      PermissionUtil.isMemberAbove(
        mockGuild.members.get('280158289667555328')!,
        mockGuild.members.get('743701282790834247')!
      )
    ).toBeFalsy());

  it('should return "sendMessages" on PermissionUtil#stringify', () =>
    expect(PermissionUtil.stringify(Constants.Permissions.sendMessages)).toStrictEqual('sendMessages'));

  // Stolen from Nino v0
  // https://github.com/NinoDiscord/Nino/blob/0.x/src/util/PermissionUtils.test.ts
  it('the admin should overlap an all permission denying channel', () => {
    expect(PermissionUtil.overlaps(8, 255)).toBe(true);
  });

  it('a regular user with correct permissions should overlap a channel with less permissions', () => {
    expect(PermissionUtil.overlaps(255, 17)).toBe(true);
  });

  it('a regular user should overlap a channel with the same permissions', () => {
    expect(PermissionUtil.overlaps(19, 19)).toBe(true);
  });

  it('a regular user should not overlap a channel with more permissions', () => {
    expect(PermissionUtil.overlaps(4, 20)).toBe(false);
  });

  it('a regular user should not overlap a channel with different permissions', () => {
    expect(PermissionUtil.overlaps(4, 16)).toBe(false);
  });
});
