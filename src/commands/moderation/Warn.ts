import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');
import PermissionUtils from '../../util/PermissionUtils';

export default class WarnCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'warn',
            description: 'Warns a member from this guild',
            usage: '<user>',
            aliases: ['addwarn'],
            category: 'Moderation',
            userpermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry but you will need to specify a user!');

        const u = findUser(this.client, ctx.args.get(0))!;
        if (!u) {
            return ctx.send('I can\'t find this user!');
        }
        const member = ctx.guild.members.get(u.id);

        if (!member) return ctx.send(`User \`${u.username}#${u.discriminator}\` is not in this guild?`);

        const punishments = await this.client.punishments.addWarning(member!);
        for (let i of punishments) {
            await this.client.punishments.punish(member!, i, 'Automod');
        }
        const warns = await this.client.warnings.get(ctx.guild.id, member.id);
        return ctx.send(`Successfully warned ${member.username}#${member.discriminator}! They now have ${warns!.amount} warnings!`);
    }
}