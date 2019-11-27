import Event from '../structures/Event';
import NinoClient from '../structures/Client';
import { User, Member } from 'eris';

export default class UserUpdateEvent extends Event {
    constructor(client: NinoClient) {
        super(client, 'userUpdate');
    }

    getMutualGuilds(user: User): Member[] {
        let members: Member[] = [];
        for (let [,guild] of this.client.guilds) {
            if (!!guild.members[user.id]) members.push(guild.members[user.id]);
        }
        return members;
    }

    async emit(user: User) {
        for (let member of this.getMutualGuilds(user)) this.client.autoModService.handleMemberNameUpdate(member);
    }
}