import { Role, Member, Permission, GuildChannel, Constants } from "eris";

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
     * 
     * @param role 
     */
    public static permissionsOf(role: Role, channel: GuildChannel) {
        let permission = role.permissions.allow;
        if(permission & Constants.Permissions.administrator) {
            return Constants.Permissions.all;
        }
        let overwrite = channel.permissionOverwrites.get(channel.guild.id);
        if(overwrite) {
            permission = (permission & ~overwrite.deny) | overwrite.allow;
        }
        let deny = 0;
        let allow = 0;
        const roles = channel.guild.roles.filter(r => r.position <= role.position).map(r => r.id);
        for(const roleID of roles) {
            if((overwrite = channel.permissionOverwrites.get(roleID))) {
                deny |= overwrite.deny;
                allow |= overwrite.allow;
            }
        }
        permission = (permission & ~deny) | allow;
        return permission;
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