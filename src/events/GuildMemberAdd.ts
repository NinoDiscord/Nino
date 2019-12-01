import { Guild, Member } from 'eris';
import Client from '../structures/Bot';
import Event from '../structures/Event';
import { Punishment, PunishmentType } from '../structures/managers/PunishmentManager';

export default class GuildMemberJoined extends Event {
    constructor(client: Client) {
        super(client, 'guildMemberAdd');
    }


    async emit(guild: Guild, member: Member) {
        this.bot.autoModService.handleMemberJoin(member);
        const cases = await this.bot.cases.getAll(guild.id);
        const his = cases.sort(m => m.id).filter(m => m.victim === member.id);
        if (his.length > 0) {
            const latest = his[his.length - 1];
            if (latest.type === 'mute') await this.bot.punishments.punish(member, new Punishment(PunishmentType.Mute, { moderator: guild.members.get(this.bot.client.user.id)!.user}), 'mute evading');
        }
    }
}