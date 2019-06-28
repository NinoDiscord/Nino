import { Constants } from 'eris';
import NinoClient from '../../structures/Client';
import Command from '../../structures/Command';
import Context from '../../structures/Context';

export default class ReasonCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'reason',
            description: 'Updates a case reason',
            usage: '<caseID> <reason>',
            aliases: [ 'update-reason' ],
            category: 'Moderation',
            guildOnly: true,
            userpermissions: Constants.Permissions.banMembers,
            botpermissions: Constants.Permissions.manageMessages
        });
    }

    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Missing `<caseID>` argument');
        if (!ctx.args.has(1)) return ctx.send('Missing `<reason>` argument');

        const caseID = ctx.args.get(0);
        const reason = ctx.args.get(1);
        const _case = await this.client.cases.get(ctx.guild.id, parseInt(caseID));
        const settings = await this.client.settings.get(ctx.guild.id); 

        if (!_case || _case === null) return ctx.send(`Case #${caseID} was not found.`);

        await this.client.cases.update(ctx.guild.id, parseInt(caseID), {
            $set: {
                reason
            }
        }, async(error) => {
            if (error) return ctx.send(`Unable to update case #${caseID}: \`${reason}\``);
            const m = await this.client.getMessage(settings!.modlog.channelID, _case.message);
            await this.client.punishments.editModlog(_case, m);
        });
    }
}