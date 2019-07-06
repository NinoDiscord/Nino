import { Schema, Document, model } from 'mongoose';
import { ok } from 'assert';

export interface GuildModel extends Document {
    guildID: string;
    prefix: string;
    mutedRole: string;
    modlog: string;
    automod: {
        spam: boolean,
        invites: boolean,
        badwords: {
            enabled: boolean,
            wordlist: string[];
        },
        raid: boolean
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
        type: Array
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;