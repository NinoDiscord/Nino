import NinoClient from '../structures/Client';
import { User } from 'eris';

export function findId(client: NinoClient, query: string): string | undefined {
    if (/^[0-9]+$/.test(query)) {
        return query;
    } else if (/^<@!?([0-9]+)>$/.test(query)) {
        return (/^<@!?([0-9]+)>$/.exec(query)![1]);
    }
    return undefined;
};

export default function (client: NinoClient, query: string): User | undefined {
    const id = findId(client, query);
    if (!!id) {
        return client.users.get(id);
    } else {
        return undefined;
    }
};