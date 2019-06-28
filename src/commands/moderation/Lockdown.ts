import NinoClient from "../../structures/Client";
import Command from '../../structures/Command';
import { Constants, Channel, TextChannel, Role } from "eris";
import CommandContext from "../../structures/Context";
import PermissionUtils from "../../util/PermissionUtils";

export default class LockdownCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'lockdown',
            description: 'Locks down a channel, multiple channels or all channels for all roles below the specified role.',
            botpermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
            usage: '[all] <channel> <channel>... [--role] [--release]'
        })
        this.userpermissions = this.botpermissions;
    }

    getChannel(s: string, ctx: CommandContext): TextChannel | undefined {
        if (/^[0-9]+$/.test(s)) { // this is an id
            const channel = ctx.guild.channels.get(s);
            if (!channel || channel.type === 0) {
                return;
            }
            return channel as TextChannel;
        } else if (/^<#[0-9]+>$/.test(s)) { // this is a channel mention
            const channel = ctx.guild.channels.get(s.substring(2, s.length - 1));
            if (!channel || channel.type === 0) {
                return;
            }
            return channel as TextChannel;
        } 
        return ctx.guild.channels.find(x => x.type === 0 && x.name.toLowerCase() === s) as TextChannel;
    }

    getRole(s: string, ctx: CommandContext): Role | undefined {
        if (/^[0-9]+$/.test(s)) { // this is an id
            return ctx.guild.roles.get(s);
        } else if (/^<@&[0-9]+>$/.test(s)) { // this is a channel mention
            return ctx.guild.roles.get(s.substring(3, s.length - 1));
        } 
        return ctx.guild.roles.find(x => x.name.toLowerCase() === s);
    }

    async run(ctx: CommandContext) {
        if (!ctx.args.has(0)) {
            return ctx.send('The channels argument is required.');
        }
        const role = this.getRole(ctx.flags.get('role') as string, ctx);

        if (!role || !PermissionUtils.topRole(ctx.me) || PermissionUtils.topRole(ctx.me)!.position <= role.position) {
            return ctx.send('Role doesn\'t exist or is above me in the heirarchy.') 
        }

        const channels = (ctx.args.args.findIndex(x => x === 'all') !== -1) ? ctx.guild.channels.filter(c => c.type === 0).map(c => c as TextChannel) : ctx.args.args.map(x => this.getChannel(x, ctx)).filter(x => !!x);
        const roles = ctx.guild.roles.filter(r => r!.position > role!.position && r!.position < PermissionUtils.topRole(ctx.me)!.position);

        for (let channel of channels) {
            if (!!channel && ((ctx.me.permission.allow|channel.permissionsOf(ctx.me.id).allow) & Constants.Permissions.manageChannels) !== 0) {
                if (ctx.flags.get('release') as boolean) {
                    if (!!channel.topic && channel.topic!.startsWith('[LOCKED]')) {
                        for (let rs of roles) {
                            await channel.deletePermission(rs!.id, 'Channel Lockdown Over');
                        }
                        await channel.edit({topic: channel.topic !== '[LOCKED]' ? channel.topic.substring(9) : ''})
                        await channel.deletePermission(role!.id, 'Channel Lockdown Over')
                        await channel.editPermission(ctx.guild.id, Constants.Permissions.sendMessages, 0, 'role', 'Channel Lockdown Over');
                        await ctx.send(`Channel <#${channel.id}> is now unlocked.`);
                    }
                } else {
                    if ((PermissionUtils.permissionsOf(role, channel) & Constants.Permissions.sendMessages) !== 0) {
                        await channel.edit({topic: `[LOCKED]${!!channel.topic ? ' ' + channel.topic : ''}`})
                        await channel.editPermission(ctx.me.id, Constants.Permissions.sendMessages, 0, 'member', 'Channel Lockdown');
                        await channel.editPermission(ctx.guild.id, 0, Constants.Permissions.sendMessages, 'role', 'Channel Lockdown');
                        await channel.editPermission(role!.id, 0, Constants.Permissions.sendMessages, 'role', 'Channel Lockdown');
                        for (let rs of roles) {
                            await channel.editPermission(rs!.id, Constants.Permissions.sendMessages, 0, 'role', 'Channel Lockdown')
                        }
                    }
                    await ctx.send(`Channel <#${channel.id}> is now locked down.`);
                }
            }
        }
    }
}