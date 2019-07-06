import { Guild } from 'eris';
import Client from '../structures/Client';
import Event from '../structures/Event';

export default class GuildJoinedEvent extends Event {
    constructor(client: Client) {
        super(client, 'guildCreate');
    }

    async emit(guild: Guild) {
        this.client.settings.create(guild.id);
        this.client.logger.discord(`Joined ${guild.name} (${guild.id})`);
        this.client.editStatus('online', {
            name: `${this.client.config['discord'].prefix}help | ${this.client.guilds.size.toLocaleString()} Guilds`,
            type: 0
        });

        const owner = this.client.users.get(guild.ownerID)!;
        const features = this.features();
        if (this.client.webhook)
            this.client.webhook.embed(
                this
                    .client
                    .getEmbed()
                    .setTitle(`${this.client.user.username}#${this.client.user.discriminator} | Joined ${guild.name}`)
                    .setThumbnail(guild.icon? guild.iconURL!: '')
                    .addField('ID', guild.id, true)
                    .addField('Owner', `${owner.username}#${owner.discriminator} (\`${owner.id}\`)`, true)
                    .addField('Features', guild.features.map(s => features[s]).join(', '), true)
                    .addField('Shard', `#${guild.shard.id} (${guild.shard.latency}ms)`, true)
                    .addField(`Channels [${guild.channels.size}]`, guild.channels.map(s => `${s.type === 0? `#${s.name}`: s.name}`).join(' | '))
                    .addField(`Roles [${guild.roles.size}]`, guild.roles.map(s => `<@&${s.id}>`).join(', '), true)
            );
    }

    features(): { [x: string]: string } {
        return {
            ANIMATED_ICON: 'Animated Icon',
            INVITE_SPLASH: 'Invite Splash',
            COMMERCE: 'Commerce',
            LURKABLE: 'Lurkable',
            PARTNERED: 'Parentered',
            NEWS: 'News',
            BANNER: 'Guild Banner',
            MORE_EMOJI: 'More Emojis',
            VERIFIED: 'Verified',
            VIP_REGIONS: 'All VIP Regions',
            VANITY_URL: 'Custom Vanity Url'
        };
    }
}