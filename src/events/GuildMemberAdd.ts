import { Guild, Member } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';
import AutoModRaid from '../structures/automod/Raid';

export default class GuildMemberJoined extends Event {
    private automodraid: AutoModRaid;

    constructor(client: Client) {
        super(client, 'guildMemberAdd');
        this.automodraid = new AutoModRaid(client);
    }


    async emit(guild: Guild, member: Member) {
        this.automodraid.handle(member);
    }
}