import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import { Constants } from 'eris';

export default class SettingsCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'settings',
            description: 'Returns the current settings in the current guild.',
            aliases: [],
            userpermissions: Constants.Permissions.manageGuild,
            subcommands: [
                {
                    name: 'enable',
                    description: 'Enables a configuration key',
                    run: async(client: NinoClient, ctx: Context) => {
                        const setting = ctx.args.get(0);
                        switch (setting) {
                            case 'prefix': {
                                const prefix = ctx.args.get(1);
                                if (!prefix) return ctx.send('Hey! You\'ll need to set a prefix.');
                                if (prefix.length > 20) return ctx.send(':warning: The prefix cannot reach the threshold. (`20`)');
                                if (prefix.includes('@everyone') || prefix.includes('@here')) return ctx.send(':x: Hey! Why are you pinging everyone?! We don\'t allow at everyone pings as prefixes.');
                                this.client.settings.update(ctx.guild.id, {
                                    $set: {
                                        prefix
                                    }
                                }, (error) => {
                                    if (error) return ctx.send('I was unable to set the prefix to `' + prefix + '`...');
                                    return ctx.send(`The prefix has been set to \`${prefix}\` Run \`${prefix}ping\` to test it!`);
                                });
                            }

                            case 'automod': {
                                await ctx.send(stripIndents`
                                    **Do you want to enable the "automod" feature?**
                                    Say \`yes\` or \`no\` to enable/disable it
                                    Say \`cancel\` or \`finish\` to cancel this entry.
                                `);

                                const collector = await ctx.collector.awaitMessage(
                                    (m) => (
                                        m.author.id === ctx.sender.id && (['yes', 'no', 'cancel', 'finish']).includes(m.content)
                                    ),
                                    {
                                        channelID: ctx.message.channel.id,
                                        userID: ctx.sender.id,
                                        timeout: 60
                                    }
                                );

                                if (['yes'].includes(collector.content)) {
                                    this.client.settings.update(ctx.guild.id, {
                                        $set: {
                                            'automod.enabled': true
                                        }
                                    }, (error) => {
                                        if (error) return ctx.send('Unable to enable the automod feature.');
                                        return ctx.send('Enabled the `automod` feature!')
                                    });
                                } else if (['no', 'cancel', 'finish'].includes(collector.content)) {
                                    return ctx.send('Cancelled entry~');
                                }
                            }
                        }
                    }
                },
                {
                    name: 'disable',
                    description: 'Disables a configuration setting',
                    run: async(client: NinoClient, ctx: Context) => {

                    }
                }
            ],
            guildOnly: true
        });
    }

    async run(ctx: Context) {
        const settings = await this.client.settings.get(ctx.guild.id);
        const embed = this
            .client
            .getEmbed()
            .setTitle(`Configuration for ${ctx.guild.name}`)
            .setDescription(stripIndents`
                \`\`\`ini
                [guild.prefix]: ${settings!.prefix}
                [guild.modlog.enabled]: ${settings!.modlog.enabled? 'Yes': 'No'}
                [guild.modlog.channelID]: ${settings!.modlog.channelID === null? 'No channel was set.': ctx.guild.channels.get(this.client.channelGuildMap[settings!.modlog.channelID])!.name}
                [guild.automod.spam]: ${settings!.automod.spam? 'Yes': 'No'}
                [guild.automod.invites]: ${settings!.automod.spam? 'Yes': 'No'}
                [guild.automod.badwords.enabled]: ${settings!.automod.badwords.enabled? 'Yes': 'No'}
                [guild.automod.raid]: ${settings!.automod.raid? 'Yes': 'No'}
                \`\`\`
            `)
            .setFooter('You\'re viewing the configuration because you didn\'t specify a subcommand', this.client.users.get(ctx.guild.ownerID)!.avatarURL);

        return ctx.embed(embed.build());
    }
}