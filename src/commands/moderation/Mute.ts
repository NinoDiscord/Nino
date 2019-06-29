import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');

export default class MuteCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'mute',
            description: 'Mutes a member from this guild',
            usage: '<user> [--reason] [--time]',
            aliases: ['slience'],
            category: 'Moderation',
            userpermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels,
            botpermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry but you will need to specify a user!');

        const u = findUser(this.client, ctx.args.get(0))!;
        if (!u) {
            return ctx.send('I can\'t find this user!')
        }
        const member = ctx.guild.members.get(u.id);

        if (!member) return ctx.send(`User \`${u.username}#${u.discriminator}\` is not in this guild?`);

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        let time = (ctx.flags.get('time') || ctx.flags.get('t'));
        if (typeof time === 'boolean') return ctx.send('You will need to specify time to be alloted');
        
        const t = !!time ? ms(time) : undefined;

        const punishment = new Punishment(PunishmentType.Mute, {
            moderator: ctx.sender,
            temp: t
        });

        await this.client.punishments.punish(member!, punishment, (reason as string | undefined));
    }
}