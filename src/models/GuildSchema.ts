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
            wordlist: string[];
        },
        raid: boolean
    },
    punishments: Map<Number, String>
}

const schema = new Schema<GuildModel>({
    guildID: {
        type: String,
        unique: true
    },
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
    },
    punishments: {
        type: Map
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;