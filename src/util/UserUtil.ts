import NinoClient from '../structures/Client';
import { User } from 'eris';

export default (client: NinoClient, query: string): User | undefined => {
    if (/^[0-9]+$/.test(query)) {
        const user = client.users.get(query);
        if (!user || user === null) return undefined;
        return user;
    } else if (/^<@!?[0-9]+>$/.exec(query)) {
        const user = client.users.get(query.substring(3, query.length - 1));
        if (!user || user === null) return undefined;
        return user;
    }

    return client.users.get(query);
};