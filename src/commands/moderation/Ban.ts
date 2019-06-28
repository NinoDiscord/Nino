import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class BanCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'ban',
            description: 'Ban a member in the current guild',
            usage: '<user> [--reason] [--softban]',
            aliases: ['banne', 'bean'],
            category: 'Moderation',
            guildOnly: true,
            userpermissions: Constants.Permissions.banMembers,
            botpermissions: Constants.Permissions.banMembers
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry but you will need to specify a user.');

        const user = await this.client.getRESTUser(ctx.args.get(0));
        const member = ctx.guild.members.get(user.id);

        if (!member || member === null) return ctx.send(`User \`${user.username}#${user.discriminator}\` is not in this guild?`);

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        const punishment = new Punishment(PunishmentType.Ban, {
            moderator: ctx.sender,
            soft: (ctx.flags.get('soft') as boolean)
        });

        await this.client.punishments.addWarning(member!);
        await this.client.punishments.punish(member!, punishment, reason as string);
    }
}