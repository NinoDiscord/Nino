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
            category: 'Moderation',
            guildOnly: true,
            botpermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
            usage: '[all] <channel> <channel>... [--roles] [--release]'
        });
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
        if (ctx.flags.get('roles') === true) {
            return ctx.send('The roles flag is not supposed to be a boolean!')
        }
        const roles = (ctx.flags.get('roles') as string).split(', ').map(role=>{return {perm: role[0], role: this.getRole(role.slice(1), ctx)}}).filter(({ role }) => !!role && PermissionUtils.topRole(ctx.me) && PermissionUtils.topRole(ctx.me)!.position > role.position);

        if (roles.length === 0) {
            return ctx.send('All roles can not be modified by me! Please check that the roles are under this bot in the heirarchy.'); 
        }

        const channels = (ctx.args.args.findIndex(x => x === 'all') !== -1) ? ctx.guild.channels.filter(c => c.type === 0).map(c => c as TextChannel) : ctx.args.args.map(x => this.getChannel(x, ctx)).filter(x => !!x).map(tc=>tc!);
        
        if (channels.length === 0) {
            return ctx.send("No valid channels were selected.");
        }

        if (!ctx.flags.get('release')) {
            const msg = await ctx.send('Backing up former permissions...')
            const currstate = channels.map(c => {return {channel: c, pos: c.permissionOverwrites.filter(r => !!roles.find((ro) => ro.role!.id === r.id)).map(po => {return {role: po.id, allow: po.allow, deny: po.deny}})}})
        
            for (let {channel, pos} of currstate) {
                await ctx.client.redis.set(`lockdownstate:${channel.id}`, JSON.stringify(pos));
            }
            msg.edit('Done!')
        }
        


        for (let channel of channels) {
            if (((ctx.me.permission.allow|channel.permissionsOf(ctx.me.id).allow) & Constants.Permissions.manageChannels) !== 0) {
                if (ctx.flags.get('release') as boolean) {
                    const formerperms = await ctx.client.redis.get(`lockdownstate:${channel.id}`);
                    if (!!formerperms) {
                        for (let po of JSON.parse(formerperms)) {
                            await channel.editPermission(po.id, po.allow, po.deny, 'Channel Lockdown Over');
                        }
                        await channel.editPermission(ctx.guild.id, Constants.Permissions.sendMessages, 0, 'role', 'Channel Lockdown Over');
                        await ctx.send(`Channel ${channel.mention} is now unlocked.`);
                    }
                } else {
                    for (let role of roles) {
                        if (formerperms.)
                    }
                    await ctx.send(`Channel <#${channel.id}> is now locked down.`);
                }
            }
        }
    }
}