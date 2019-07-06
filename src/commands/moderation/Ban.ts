import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');

export default class BanCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'ban',
            description: 'Ban a member in the current guild',
            usage: '<user> [--reason] [--soft] [--days] [--time]',
            aliases: ['banne', 'bean'],
            category: 'Moderation',
            guildOnly: true,
            userpermissions: Constants.Permissions.banMembers,
            botpermissions: Constants.Permissions.banMembers
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry but you will need to specify a user.');

        const u = findUser(this.client, ctx.args.get(0))!;
        if (!u) {
            return ctx.send('I can\'t find this user!')
        }
        const member = ctx.guild.members.get(u.id);

        if (!member || member === null) return ctx.send(`User \`${u.username}#${u.discriminator}\` is not in this guild?`);

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        let time = (ctx.flags.get('time') || ctx.flags.get('t'));
        if (typeof time === 'boolean') return ctx.send('You will need to specify time to be alloted');

        const days = (ctx.flags.get('days') || ctx.flags.get('d'));
        if (typeof days === 'boolean' || !/[0-9]+/.test(days)) return ctx.send('You need to specify the amount days to delete messages of.')
        
        const t = !!time ? ms(time) : undefined;

        const punishment = new Punishment(PunishmentType.Ban, {
            moderator: ctx.sender,
            soft: (ctx.flags.get('soft') as boolean),
            temp: t,
            days: Number(days)
        });

        await this.client.punishments.punish(member!, punishment, reason as string | undefined);
    }
}