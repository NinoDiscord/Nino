import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import { findId } from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class UnbanCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'unban',
            description: 'Unbans a user from a guild',
            usage: '<user> [--reason]',
            aliases: ['unbanne'],
            category: 'Moderation',
            guildOnly: true,
            userpermissions: Constants.Permissions.banMembers,
            botpermissions: Constants.Permissions.banMembers
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry but you will need to specify a user.');

        const id = findId(ctx.client, ctx.args.get(0));

        if (!id) {
            return ctx.send('Please type the id or mention the user (<@id>/<@!id>)')
        }

        if (!(await ctx.guild.getBans()).find(v => v.user.id === id)) {
            return ctx.send('The user is not banned from this guild.')
        }

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        await this.client.timeouts.cancelTimeout(id, ctx.guild, 'unban');
        await ctx.send('User successfully unbanned.');
        const punishment = new Punishment(PunishmentType.Unban, { moderator: ctx.sender });
        await this.client.punishments.punish({id: id!, guild: ctx.guild}, punishment, (reason as string | undefined));
    }
}