import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import findUser from '../../util/UserUtil';
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

        const u = findUser(this.client, ctx.args.get(0))!;
        const user = await this.client.getRESTUser(u.id);
        const member = ctx.guild.members.get(user.id);

        if (!member || member === null) return ctx.send(`User \`${user.username}#${user.discriminator}\` is not in this guild?`);

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        const punishment = new Punishment(PunishmentType.Unban, { moderator: ctx.sender });
        await this.client.punishments.punish(member!, punishment, (reason as string));
    }
}