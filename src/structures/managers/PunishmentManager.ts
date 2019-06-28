import NinoClient from "../Client";
import { Member, TextChannel, Constants, User, Message, Guild } from "eris";
import PermissionUtils from "../../util/PermissionUtils";
import EmbedBuilder from "../EmbedBuilder";
import { stripIndents } from 'common-tags';
import ms = require("ms");
import { CaseModel } from "../../models/CaseSchema";

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
    Unban = "unban",
    RemoveRole = "unrole"
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
        if (punishment.type === "ban" || punishment.type === "unban") {
            return Constants.Permissions.banMembers;
        }
        if (punishment.type === "kick") {
            return Constants.Permissions.kickMembers; 
        }
        if (punishment.type === "role" || punishment.type === "unmute" || punishment.type === "unrole") {
            return Constants.Permissions.manageRoles;
        }
        if (punishment.type === "mute") {
            return Constants.Permissions.manageRoles | Constants.Permissions.manageChannels; 
        }
        return 0;
    }

    /**
     * Warns the user and punishes him according to the server's settings.
     * Returns the punishment for the amount of warnings he now has (if exists)
     * @param member the member to warn
     */
    async addWarning(member: Member): Promise<Punishment[]> {
        const me = member.guild.members.get(this.client.user.id)!;
        const settings = await this.client.settings.get(member.guild.id);
        if (!settings) return [];

        let warnings = await this.client.warnings.get(member.guild.id, member.id);
        if (!warnings) {
            this.client.warnings.create(member.guild.id, member.id);
        } else {
            await this.client.warnings.update(member.guild.id, member.id, {'amount': Math.min(warnings.amount + 1, 5)});
        }
        const warns = Math.min(!!warnings ? warnings!.amount + 1 : 1, 5);

        let res: Punishment[] = [];
        for (let options of settings.punishments.filter(x => x.warnings === warns)) {
            res.push(new Punishment(options.type as PunishmentType, Object.assign({moderator: me.user}, options)));
        }

        return res;    
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
    async punish(member: Member | {id: string, guild: Guild}, punishment: Punishment, reason?: string) {
        const me = member.guild.members.get(this.client.user.id)!;
        const guild = member.guild;

        const settings = await this.client.settings.get(guild.id);

        if ((member instanceof Member && !PermissionUtils.above(me, member)) || (me.permission.allow & this.punishmentPerms(punishment)) === 0)
            return;

        switch (punishment.type) {
            case "ban": 
                if (!(member instanceof Member))
                    return;
                const days: number = punishment.options.days ? punishment.options.days : 7;
                const time = punishment.options.temp;
                const soft: boolean = !!punishment.options.soft;
                await member.ban(days, reason);
                if (soft) {
                    await member.unban(reason);
                } else if (time !== undefined && time > 0) {
                    setTimeout(async () => {
                        await member.unban('time\'s up');
                    }, time!);
                }
                break;
            case "kick":
                if (!(member instanceof Member))
                    return;
                await member.kick(reason);
                break;
            case "mute": 
                if (!(member instanceof Member))
                        return;
                const temp = punishment.options.temp;
                let muterole = settings!.mutedRole;
                if (!muterole) break;
                await member.addRole(muterole, reason);
                if (!!temp) {
                    setTimeout(async () => {
                        if (me.permission.has('manageRoles') && PermissionUtils.above(me, member)) {
                            await this.punish(member, new Punishment('unmute' as PunishmentType, { moderator: !!punishment.options.moderator ? punishment.options.moderator : me.user }), 'time\'s up');
                        }
                    }, temp!);
                }
                break;
            case "role":
                if (!(member instanceof Member))
                    return;
                const role = member.guild.roles.get(punishment.options.roleid!);
                if (!!role && !!PermissionUtils.topRole(me) && PermissionUtils.topRole(me)!.position > role.position)
                    await member.addRole(role.id, reason);
                break;
            case "unmute":
                if (!(member instanceof Member))
                    return;
                const muted = guild.roles.find(x => x.name === 'muted');

                if (!!muted && !!member.roles.find(x => x === muted.id)) {
                    await member.removeRole(muted.id, reason);
                }
                break;
            case "unban":
                if (!guild.members.find(x => x.id === member.id)) {
                    await guild.unbanMember(member.id, reason);
                }
                break;
            case "unrole":
                const srole = member.guild.roles.get(punishment.options.roleid!);
                if (member instanceof Member && !!srole && !!PermissionUtils.topRole(me) && PermissionUtils.topRole(me)!.position > srole!.position)
                    await member.removeRole(srole.id, reason);
                break;
        }
        if (punishment.type !== 'role' && punishment.type !== 'unrole') {
            if (member instanceof Member) {
                this.postToModLog(member, punishment, reason);
            } else {
                const user = await this.client.getRESTUser(member.id);
                this.postToModLog({username: user.username, discriminator: user.discriminator, guild: member.guild, id: member.id}, punishment, reason);
            }
        }
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
    async postToModLog(member: Member | {guild: Guild, id: string, username: string, discriminator: string}, punishment: Punishment, reason?: string) {
        const settings = await this.client.settings.get(member.guild.id);
        if (!settings || !settings!.modlog.enabled) return;
        const modlog = member.guild.channels.get(settings!.modlog.channelID) as TextChannel;
        if (!!modlog && modlog!.permissionsOf(this.client.user.id).has('sendMessages') && modlog!.permissionsOf(this.client.user.id).has('embedLinks')) {
            const action = this.determineType(punishment.type);
            const c = await this.client.cases.create(member.guild.id, punishment.options.moderator.id, punishment.type, member.id, reason);
            const message = await modlog.createMessage({
                embed: new EmbedBuilder()
                    .setTitle( `Case #${c.id} **|** ${member.username} has been ${punishment.type + action.suffix}!`)
                    .setDescription(stripIndents`
                        **User**: ${member.username}#${member.discriminator} (ID: ${member.id})
                        **Moderator**: ${punishment.options.moderator.username}#${punishment.options.moderator.discriminator} (ID: ${punishment.options.moderator.id})
                        **Reason**: ${reason || 'Unknown'}${ !!punishment.options.soft ? '\n**Type**: Soft Ban': ''}${ !punishment.options.soft && !!punishment.options.temp ? `\n**Time**: ${ms(punishment.options.temp, {long: true})}` : ''}
                    `)
                    .setColor(action.action)
                    .build()
            });
            await this.client.cases.update(member.guild.id, c.id, {message: message.id}, (e) => {
                if (!!e)
                    this.client.logger.error(`Couldn't update the case: ${e}`)
            });
        }
    }

    async editModlog(_case: CaseModel, m: Message) {
        const action = this.determineType(_case.type);
        const member = await this.client.getRESTUser(_case.victim)!;
        const moderator =  await this.client.getRESTUser(_case.moderator)!;
        await m.edit({
            embed: new EmbedBuilder()
                .setTitle( `Case #${_case.id} **|** ${member.username} has been ${_case.type + action.suffix}!`)
                .setDescription(stripIndents`
                    **User**: ${member.username}#${member.discriminator} (ID: ${member.id})
                    **Moderator**: ${moderator.username}#${moderator.discriminator} (ID: ${moderator.id})
                    **Reason**: ${_case.reason}
                `)
                .setColor(action.action)
                .build()
        });
    }

    determineType(type: string): { action: number; suffix: string; } {
        const action = {
            "ban": 0xff0000,
            "kick": 0xfff000,
            "mute": 0xfff000,
            "unban": 0xfff00,
            "unmute": 0xfff00
        }[type];
        let suffix;
        if (type === 'ban')
            suffix = 'ned';
        else if (type.endsWith('e'))
            suffix = 'd';
        else
            suffix = 'ed';

        return {
            action,
            suffix
        };
    }
}