import Bot from '../structures/Bot';
import { User } from 'eris';

export function findId(query: string): string | undefined {
  if (/^[0-9]+$/.test(query)) return query;
  else if (/^<@!?([0-9]+)>$/.test(query))
    return /^<@!?([0-9]+)>$/.exec(query)![1];
  return undefined;
}

export default function(bot: Bot, query: string): User | undefined {
  const id = findId(query);
  if (id) return bot.client.users.get(id);
  else return undefined;
}
