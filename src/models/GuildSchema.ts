import { Schema, Document, model } from 'mongoose';

export interface GuildModel extends Document {
  guildID: string;
  prefix: string;
  mutedRole: string;
  modlog: string;
  locale: string;
  automod: {
    dehoist: boolean;
    spam: boolean;
    invites: boolean;
    badwords: {
      enabled: boolean;
      wordlist: string[];
    };
    raid: boolean;
    mention: boolean;
  };
  responses: {
    badwords: {
      enabled: boolean;
      message: string;
    }
    invite: {
      enabled: boolean;
      message: string
    }
    mention: {
      enabled: boolean;
      message: string;
    }
    spam: {
      enabled: boolean;
      message: string;
    }
  };
  punishments: { 
    type: string; 
    warnings: number; 
    [options: string]: any 
  }[];
  logging: {
    enabled: boolean;
    channelID: string;
    ignore: string[];
    events: {
      messageDelete: boolean;
      messageUpdate: boolean;
    };
  };
}

const schema = new Schema<GuildModel>({
  guildID: {
    type: String,
    unique: true,
  },
  prefix: String,
  mutedRole: String,
  modlog: {
    type: String,
    default: null,
  },
  automod: {
    dehoist: {
      type: Boolean,
      default: false,
    },
    spam: {
      type: Boolean,
      default: false,
    },
    invites: {
      type: Boolean,
      default: false,
    },
    badwords: {
      enabled: {
        type: Boolean,
        default: false,
      },
      wordlist: [],
    },
    raid: {
      type: Boolean,
      default: false,
    },
    mention: {
      type: Boolean,
      default: false,
    },
  },
  punishments: {
    type: Array,
  },
  responses: {
    type: Object
  },
  logging: {
    enabled: {
      type: Boolean,
      default: false
    },
    channelID: {
      type: String,
      default: null
    },
    ignore: {
      type: Array,
      default: []
    },
    events: {
      messageDelete: {
        type: Boolean,
        default: false
      },
      messageUpdate: {
        type: Boolean,
        default: false
      }
    }
  },
  locale: {
    type: String,
    default: 'en_US'
  }
});

const _model = model<GuildModel>('guilds', schema, 'guilds');
export default _model;
