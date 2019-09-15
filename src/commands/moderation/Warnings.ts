import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import ms = require('ms');

export default class WarningsCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'warnings',
            description: 'Shows the amount of warnings a member has.',
            usage: '<user>',
            aliases: ['warns'],
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

        const settings = await this.client.warnings.get(ctx.guild.id, member.id);
        if (!settings) {
            return ctx.send(`${member.username}#${member.discriminator} has 0 warnings.`);
        } else {
            return ctx.send(`${member.username}#${member.discriminator} has ${settings!.amount} warnings.`);
        }
    }
}