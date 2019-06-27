import { Schema, Document, model } from 'mongoose';
import { ok } from 'assert';

export interface GuildModel extends Document {
    guildID: string;
    prefix: string;
    modlog: {
        enabled: boolean;
        channelID: string;
    },
    automod: {
        enabled: boolean,
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
        enabled: {
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
        }
    },
    punishments: {
        type: Array,
        validate: {
            validator: (punishments: {type: string, warnings: number, [options: string]: any}[]) => {
                for (let punishment of punishments) {
                    if (punishment.warnings < 1 || punishment.warnings > 5) {
                        return false;
                    }
                }
                for (let i = 1; i < 5; i++) {
                    const p = punishments.filter(x => x.warnings === i);
                    if (p.length > 3) {
                        return false;
                    }
                }
                return true;
            }
        }
    }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;