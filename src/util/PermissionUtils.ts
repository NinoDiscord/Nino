import { Constants, GuildChannel, Member, Permission, Role } from 'eris';

const PermissionNames = {
  'createInstantInvite': 'Create Instant Invite',
  'kickMembers': 'Kick Members',
  'banMembers': 'Ban Members',
  'administrator': 'Administrator',
  'manageChannels': 'Manage Channels',
  'manageGuild': 'Manage Server',
  'addReactions': 'Add Reactions',
  'viewAuditLogs': 'View Audit Logs',
  'voicePrioritySpeaker': 'Voice Priority Speaker',
  'stream': 'Go Live',
  'readMessages': 'Read Messages',
  'sendMessages': 'Send Messages',
  'sendTTSMessages': 'Send Text to Speech Messages',
  'manageMessages': 'Manage Messages',
  'embedLinks': 'Embed Links',
  'attachFiles': 'Attach Files',
  'readMessageHistory': 'Read Message History',
  'mentionEveryone': 'Mention Everyone',
  'externalEmojis': 'External Emojis',
  'viewGuildAnalytics': 'View Guild Analytics',
  'voiceConnect': 'Connect to a Voice Channel',
  'voiceSpeak': 'Speak in a Voice Channel',
  'voiceMuteMembers': 'Mute Members in a Voice Channel',
  'voiceDeafenMembers': 'Deafen Members in a Voice Channel',
  'voiceUseVAD': 'Uses VAD in Voice Channel',
  'changeNickname': 'Change Nickname',
  'manageNicknames': 'Manage All Nicknames',
  'manageRoles': 'Manage Roles',
  'manageWebhooks': 'Manage Webhooks',
  'manageEmojis': 'Manage Emojis',
  'all': 'All Permissions',
  'allGuild': 'All Guild Permissions',
  'allText': 'All Text Channel Permissions',
  'allVoice': 'All Voice Channel Permissions'
};

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
    if (
      member === null ||
        !member.roles.length
    ) return undefined;

    return member.roles
      .map(r => member.guild.roles.get(r))
      .sort((a, b) => b!.position - a!.position)[0];
  }

  /**
   * Returns whether role a is above role b in the hierarchy.
   * @param a the role that should be higher
   * @param b the role that should be lower
   */
  public static roleAbove(a?: Role, b?: Role) {
    if (a === undefined) return false;
    if (b === undefined) return true;
    return a.position > b.position;
  }

  /**
   * Returns whether member a is above member b in the hierarchy.
   * @param a the member that should be higher
   * @param b the member that should be lower
   */
  public static above(a: Member, b: Member) {
    return this.roleAbove(this.topRole(a), this.topRole(b));
  }

  /**
   * Calculates permissions of a role in a channel.
   * @param role
   * @param channel
   */
  public static permissionsOf(role: Role, channel: GuildChannel) {
    let permission = role.permissions.allow;
    if (permission & Constants.Permissions.administrator) return Constants.Permissions.all;
    let overwrite = channel.permissionOverwrites.get(channel.guild.id);
    if (overwrite) permission = (permission & ~overwrite.deny) | overwrite.allow;
    let deny = 0;
    let allow = 0;
    const roles = channel.guild.roles
      .filter(r => r.position <= role.position)
      .map(r => r.id);
    for (const roleID of roles) {
      if ((overwrite = channel.permissionOverwrites.get(roleID))) {
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
  public static toString(permission: number) {
    const perm = new Permission(permission, 0).json;
    const perms: string[] = [];
    for (const p of Object.keys(perm)) perms.push(PermissionNames[p]);

    return perms.join(', ');
  }

  /**
   * Returns whether the permission the user has overlap the permissions required
   * @param user the permission the user has
   * @param required the permissions required
   */
  public static overlaps(user: number, required: number) {
    return (
      (user & 8) != 0 || (user & required) == required // The user is an admin, automatically overwrites all permissions.
    ); // user & required give all of the permissions in common, it should be required.
  }
}
