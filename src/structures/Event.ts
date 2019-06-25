import Client from './Client';

export type Emittable = "ready" | "disconnect" | "callCreate" | "callRing" | "callDelete" |
    "callUpdate" | "channelCreate" | "channelDelete" | "channelPinUpdate" | "channelRecipientAdd" |
    "channelRecepientRemove" | "channelUpdate" | "friendSuggestionCreate" | "friendSuggestionDelete" |
    "guildAvaliable" | "guildBanAdd" | "guildBanRemove" | "guildDelete" | "guildUnavaliable" | "guildCreate" |
    "guildEmojisUpdate" | "guildMemberAdd" | "guildMemberChunk" | "guildMemberRemove" | "guildMemberUpdate" |
    "guildRoleCreate" | "guildRoleDelete" | "guildRoleUpdate" | "guildUpdate" | "hello" | "messageCreate" | 
    "messageDeleteBulk" | "messageReactionRemoveAll" | "messageDeleteBulk" | "messageReactionAdd" | 
    "messageReactionRemove" | "messageUpdate" | "presenceUpdate" | "rawWS" | "unknown" | "relationshipAdd" | 
    "relationshipRemove" | "relationshipUpdate" | "typingStart" | "unavaliableGuildCreate" | "userUpdate" |
    "voiceChannelJoin" | "voiceChannelLeave" | "voiceChannelSwitch" | "voiceStateUpdate" | "warn" | "debug" |
    "shardDisconnect" | "error" | "shardPreReady" | "connect" | "shardReady" | "shardResume" | "messageDelete";
export default class NinoEvent {
    public client: Client;
    public event: Emittable;

    constructor(client: Client, event: Emittable) {
        this.client = client;
        this.event  = event;
    }

    async emit(...args: any[]) {
        throw new SyntaxError(`Unable to run event "${this.event}" without the "emit" function.`);
    }
}