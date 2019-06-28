import { Role, Member, Permission } from "eris";

/**
 * Contains utility functions to help with permission checking and heirarchy.
 */
export default class PermissionUtils {
    /**
     * Returns the highest role the member has
     * undefined if the member doesn't have a role
     * @param member the member
     */
    public static topRole(member: Member): Role | undefined {
        return member.guild.roles.get(member.roles[member.roles.length-1]);
    }

    /**
     * Returns true if a is above b in the heirarchy, otherwise false.
     */
    public static above(a: Member, b: Member): boolean {
        if (this.topRole(a) === undefined) {
            return false;
        }
        if (this.topRole(b) === undefined) {
            return true;
        }
        return this.topRole(a)!.position > this.topRole(b)!.position;
    }

    /**
     * Shows a string representation of all of the permissions
     * @param permission the permission
     */
    public static toString(permission: number): string {
        const perm = new Permission(permission, 0).json;
        return Object.keys(perm).join(' ');
    }
}