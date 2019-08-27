import { Schema, Document, model } from 'mongoose';

export interface GuildModel extends Document {
    guildID: string;
    prefix: string;
    mutedRole: string;
    modlog: string;
    automod: {
        dehoist: boolean,
        spam: boolean,
        invites: boolean,
        badwords: {
            enabled: boolean,
            wordlist: string[];
        },
        raid: boolean
        mention: boolean
    },
    punishments: {type: string, warnings: number, [options: string]: any}[]
}

const schema = new Schema<GuildModel>({
    guildID: {
        type: String,
        unique: true
    },
    prefix: String,
    mutedRole: String,
    modlog: {
        type: String,
        default: null
    },
    automod: {
        dehoist: {
            type: Boolean,
            default: false
        },
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
        },
        mention: {
            type: Boolean,
            default: false
        }
    },
    punishments: {
        type: Array
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;