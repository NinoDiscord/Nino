import { Constants } from 'eris';
import Bot from '../structures/Bot';

export function findId(query: string): string | undefined {
  if (/^[0-9]+$/.test(query)) return query;
  else if (/^<@!?([0-9]+)>$/.test(query))
    return /^<@!?([0-9]+)>$/.exec(query)![1];
  return undefined;
}

export default async function (bot: Bot, guildID: string, query: string, callRest: boolean = true) {
  const id = findId(query);
  const hasIntent = !!((bot.client.options.intents as number)! & Constants.Intents.guildMembers);

  if (callRest) {
    if (id !== undefined && hasIntent) return bot.client.getRESTGuildMember(guildID, id);
    else if (id !== undefined && !hasIntent) return bot.client.getRESTUser(id);
    else return undefined;
  } else {
    if (id !== undefined) return bot.client.users.get(id);
    return undefined;
  }
}
