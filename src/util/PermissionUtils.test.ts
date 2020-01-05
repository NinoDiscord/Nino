import PermissionUtils from './PermissionUtils';
import { Member } from 'eris';
import mock from 'jest-mock-extended';

describe('PermissionUtils', () => {
  it('the admin should overlap an all permission denying channel', () => {
    expect(PermissionUtils.overlaps(8, 255)).toBe(true);
  });
  it('a regular user with correct permissions should overlap a channel with less permissions', () => {
    expect(PermissionUtils.overlaps(255, 17)).toBe(true);
  });
  it('a regular user should overlap a channel with the same permissions', () => {
    expect(PermissionUtils.overlaps(19, 19)).toBe(true);
  });
  it('a regular user should not overlap a channel with more permissions', () => {
    expect(PermissionUtils.overlaps(4, 20)).toBe(false);
  });
  it('a regular user should not overlap a channel with different permissions', () => {
    expect(PermissionUtils.overlaps(4, 16)).toBe(false);
  });

  describe('PermissionUtils#topRole', () => {
    beforeEach(() =>
      jest
    );
  });
});