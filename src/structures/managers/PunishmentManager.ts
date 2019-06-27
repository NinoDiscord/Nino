import NinoClient from "../Client";
import { Member, TextChannel, Constants, User } from "eris";
import PermissionUtils from "../../util/PermissionUtils";
import EmbedBuilder from "../EmbedBuilder";
import { stripIndents } from 'common-tags';

/**
 * Punishment types
 * 
 * @remarks
 * * Ban should be either a softban or a ban and should have a parameter for amount of days to delete messages.
 * * Kick is simple
 * * Mute can have the amount of time for a mute as a parameter (template: 1d2h3m4s).
 * * AddRole is to add a role, it should have roleid as a parameter
 */
export enum PunishmentType {
    Ban = "ban", 
    Kick = "kick", 
    Mute = "mute",
    AddRole = "role",
    Unmute = "unmute",
    Unban = "unban"
}

export interface PunishmentOptions {
    days?: number;
    soft?: boolean;
    moderator: User;
    temp?: number;
    roleid?: string;
}

/**
 * A punishment contains its type and other options.
 * 
 * @remarks
 * Other options can include amount of time in milliseconds for a mute, 
 * amount of days to delete messages from,
 * the type of ban (softban/ban).
 */
export class Punishment {
    public type: PunishmentType;
    public options: PunishmentOptions;
    
    constructor(type: PunishmentType, options: PunishmentOptions) {
        this.type = type;
        this.options = options;
    }
}

/**
 * This class will automate the process of warning and punishing users.
 */
export default class PunishmentManager {
    private client: NinoClient;

    constructor(client: NinoClient) {
        this.client = client;
    }

    /**
     * Returns the permissions needed to execute a punishment
     * @param punishment the punishment
     */
    punishmentPerms(punishment: Punishment): number {
        if (punishment.type === "ban") {
            return Constants.Permissions.banMembers;
        }
        if (punishment.type === "kick") {
            return Constants.Permissions.kickMembers; 
        }
        if (punishment.type === "mute" || punishment.type === "role") {
            return Constants.Permissions.manageRoles;
        }
        return 0;
    }

    /**
     * Warns the user and punishes him according to the server's settings.
     * Returns the punishment for the amount of warnings he now has (if exists)
     * @param member the member to warn
     */
    async addWarning(member: Member): Promise<Punishment | null> {
        const settings = await this.client.settings.get(member.guild.id);
        if (!settings) return null;

        let warnings = await this.client.warnings.get(member.guild.id, member.id);
        if (!warnings) {
            this.client.warnings.create(member.guild.id, member.id);
        } else {
            await this.client.warnings.update(member.guild.id, member.id, {'amount': warnings.amount + 1});
        }
        const warns = !!warnings ? warnings!.amount : 1;

        if (settings.punishments.has(warns)) {
            const options = JSON.parse(settings.punishments.get(warns)!.valueOf());
            return new Punishment(options.type, options)
        }

        return null;    
    }

    /**
     * Pardons the member (reduces amount of warnings by the amount given)
     * 
     * @remarks
     * Round the amount before applying it here
     * 
     * @param member the member
     * @param amount the amount of warnings to remove
     */
    async pardon(member: Member, amount: number) {
        let warnings = await this.client.warnings.get(member.guild.id, member.id);
        if (!!warnings && amount > 0) {
            await this.client.warnings.update(member.guild.id, member.id, {'amount': Math.max(0, warnings.amount - amount)});
        }
    }

    /**
     * Punishes the given member.
     * 
     * @remarks
     * It automatically ignores the request when the permissions are insufficient.
     * 
     * @param member the member
     * @param punishment the punishment
     * @param reason the reason
     */
    async punish(member: Member, punishment: Punishment, reason?: string) {
        const me = member.guild.members.get(this.client.user.id)!;

        if (!PermissionUtils.above(me, member) || (me.permission.allow & this.punishmentPerms(punishment)) === 0)
            return;

        switch (punishment.type) {
            case "ban": 
                const days: number = punishment.options.days ? punishment.options.days : 7;
                const soft: boolean = !!punishment.options.soft;
                await member.ban(days, reason);
                if (soft) {
                    await member.unban(reason);
                }
                break;
            case "kick":
                await member.kick(reason);
                break;
            case "mute": 
                const temp = punishment.options.temp;
                break;
                // TODO: add mute punishment
            case "role":
                const role = member.guild.roles.get(punishment.options.roleid!);
                if (!!role && !!PermissionUtils.topRole(me) && PermissionUtils.topRole(me)!.position > role.position)
                    await member.addRole(role.id, reason);
                break;
        }
        this.postToModLog(member, punishment, reason);
    }

    /**
     * Posts a punishment to the mod-log
     * 
     * @remarks
     * 
     * 
     * @param member the member
     * @param punishment the punishment
     * @param reason the reason
     */
    async postToModLog(member: Member, punishment: Punishment, reason?: string) {
        const settings = await this.client.settings.get(member.guild.id);
        if (
            !!settings &&
            settings!.modlog.enabled &&
            member.guild.channels.has(settings!.modlog.channelID) &&
            member.guild.channels.get(settings!.modlog.channelID)!.permissionsOf(this.client.user.id).has('sendMessages')
        ) {
            const actions = {
                "ban": 0xfff,
                "kick": 0xfff,
                "mute": 0xfff
            }[punishment.type];
            (member.guild.channels.get(settings!.modlog.channelID!) as TextChannel).createMessage({
                content: `:pencil: **|** User \`${member.username}#${member.discriminator}\` has been ${punishment.type}ed!`,
                embed: new EmbedBuilder()
                    .setDescription(stripIndents`
                        **Moderator**: ${punishment.options.moderator.username}#${punishment.options.moderator.discriminator}
                        **Reason**: ${reason || 'Unknown'}
                    `)
                    .build()
            });
        }
    }
}