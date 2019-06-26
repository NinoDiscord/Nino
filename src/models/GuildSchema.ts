// @todo: Dondish, do automod config
import { Schema, Document, model } from 'mongoose';

export interface GuildModel extends Document {
    guildID: string;
    prefix: string;
    modlog: {
        enabled: boolean;
        channelID: string;
    },
    automod: {
        spam: boolean,
        invites: boolean,
        badwords: {
            enabled: boolean,
            wordlist: Array<String>
        },
        raid: boolean
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
    },
    automod: {
        spam: {
            type: Boolean,
            default: false
        },
        invites: {
            type: Boolean,
            default: false
        },
        badwords: {
            enabled: {
                type: Boolean,
                default: false
            },
            wordlist: []
        },
        raid: {
            type: Boolean,
            default: false
        }
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;