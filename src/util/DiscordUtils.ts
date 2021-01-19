import { Client, Guild } from 'eris';

export async function fetchGuild(client: Client, guildId: string): Promise<Guild> {
  if (client.guilds.has(guildId)) {
    return client.guilds.get(guildId)!;
  }
  return client.getRESTGuild(guildId);
}
