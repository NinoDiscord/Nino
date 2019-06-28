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
            usage: '<"set" | "reset" | "view"> <key> <value>',
            userpermissions: Constants.Permissions.manageGuild,
            guildOnly: true
        });
    }

    async run(ctx: Context) {
        const subcommand = ctx.args.get(0);
        switch (subcommand) {
            case 'set': {
                this.set(ctx);
            } break;

            case 'reset': {
                this.reset(ctx);
            } break;

            case 'view': return this.view(ctx);

            default: {
                return ctx.send('Missing the `subcommand` argument. (`set` | `reset` | `view`)');
            }
        }
    }

    async set(ctx: Context) {
        const setting = ctx.args.get(1);
        switch (setting) {
            case 'prefix': {
                const prefix = ctx.args.get(2);
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

            case 'automod.spam': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.spam': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to ${boole? 'enable': 'disable'} the automod spam feature`);
                    return ctx.send(`${boole? 'Enabled': 'Disabled'} the automod spam feature`);
                });
            } break;
            case 'automod.raid': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.raid': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to ${boole? 'enable': 'disable'} the automod raid feature`);
                    return ctx.send(`${boole? 'Enabled': 'Disabled'} the automod raid feature`);
                });
            } break;
            case 'automod.swear': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.badwords.enabled': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to ${boole? 'enable': 'disable'} the automod swearing feature`);
                    return ctx.send(`${boole? 'Enabled': 'Disabled'} the automod swearing feature`);
                });
            } break;
            case 'automod.invites': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.invites': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to ${boole? 'enable': 'disable'} the automod invite feature`);
                    return ctx.send(`${boole? 'Enabled': 'Disabled'} the automod invite feature`);
                });
            } break;
            default: {
                return ctx.send('Invalid enabler. (`prefix` | `automod.spam` | `automod.raid` | `automod.swear` | `automod.invites`)');
            }
        }
    }

    async reset(ctx: Context) {
        const setting = ctx.args.get(1);
        switch (setting) {
            case 'prefix': {
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        prefix: 's!'
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to set the prefix to `s!`...');
                    return ctx.send(`The prefix has been set to \`s!\` Run \`s!ping\` to test it!`);
                });
            }

            case 'automod.spam': {
                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.spam': false
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to disable the automod spam feature`);
                    return ctx.send(`Disabled the automod spam feature`);
                });
            } break;
            case 'automod.raid': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.raid': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to disable the automod raid feature`);
                    return ctx.send(`Disabled the automod raid feature`);
                });
            } break;
            case 'automod.swear': {
                const bool = ctx.args.get(2);
                let boole = false;

                if (!bool) return ctx.send('Missing the `bool` argument');
                if (bool === 'true') boole = true;
                else if (bool === 'false') boole = false;
                else return ctx.send('Invalid boolean');

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.badwords.enabled': boole
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to disable the automod swearing feature`);
                    return ctx.send(`Disabled the automod swearing feature`);
                });
            } break;
            case 'automod.invites': {
                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.invites': false
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to disable the automod invite feature`);
                    return ctx.send(`Disabled the automod invite feature`);
                });
            } break;
            default: {
                return ctx.send('Invalid disabler. (`prefix` | `automod.spam` | `automod.raid` | `automod.swear` | `automod.invites`)');
            }
        }
    }

    async view(ctx: Context) {
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