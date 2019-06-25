// @todo: Dondish, do automod config
import { Schema, Document, model } from 'mongoose';

export interface GuildModel extends Document {
    guildID: string;
    prefix: string;
    modlog: {
        enabled: boolean;
        channelID: string;
    }
}

const schema = new Schema<GuildModel>({
    guildID: String,
    prefix: String,
    modlog: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelID: {
            type: String,
            default: null
        }
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;