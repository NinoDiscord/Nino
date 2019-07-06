import { stripIndents } from 'common-tags';
import NinoClient from '../../structures/Client';
import Context from '../../structures/Context';
import Command from '../../structures/Command';
import { Constants } from 'eris';
import ms = require('ms');

export default class SettingsCommand extends Command {
    constructor(client: NinoClient) {
        super(client, {
            name: 'settings',
            description: 'View or edit the guild\'s settings.',
            usage: 'set <key> <value> / reset <key> / view / add <warnings> <punishment> [--time <time> (mute/ban)] [--roleid <id> (role/unrole)] [--soft (ban)] [--days <amount> (ban: delete messages)]/ remove <punishment index>',
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

            case 'add': return this.add(ctx);

            case 'remove': return this.remove(ctx);

            default: {
                return ctx.send('Missing the `subcommand` argument. (`set` | `reset` | `view` | `add` | `remove`)');
            }
        }
    }

    async add(ctx: Context) {
        const warnings = ctx.args.get(1);
        if (!warnings || !/^[0-9]$/.test(warnings) || Number(warnings) < 1 || Number(warnings) > 5)
            return ctx.send('Amount of warnings is required, needs to between 1 to 5');
        const punishment = ctx.args.get(2);
        if (!['ban', 'mute', 'unmute', 'kick', 'role', 'unrole'].includes(punishment))
            return ctx.send('A punishment is required and it needs to be of the following: ' + ['ban', 'mute', 'unmute', 'kick', 'role', 'unrole'].join(', '))
        const temp = ctx.flags.get('time');
        if (!!temp && (typeof temp === 'boolean' || (typeof temp === 'string' && (!ms(temp as string) || ms(temp as string) < 1000))))
            return ctx.send('The time flag needs to be a correct time expression: can be 0.5h or 30m or 0.5 hours or 30 minutes or the amount in milliseconds. It also needs to be more or equal to one second.')
        const soft = !!ctx.flags.get('soft');
        const roleid = ctx.flags.get('roleid');
        if (!roleid && (punishment === 'role' || punishment === 'unrole'))
            return ctx.send('A role id is a must when the punishment is role or unrole.')

        if (!!roleid && (typeof roleid === 'boolean' || (typeof roleid === 'string' && (!/^[0-9]+$/.test(roleid) || !ctx.guild.roles.get(roleid)))))
            return ctx.send('Incorrect role id.')
        const days = ctx.flags.get('days');
        if (!!days && (typeof days === 'boolean' || (typeof days === 'string' && !/^[0-9]{1,2}$/.test(days))))
            return ctx.send('Incorrect amount of days. It is the amount of days to delete the messages in when banning.')

        this.client.settings.update(ctx.guild.id, {
            $push: {
                punishments: {
                    warnings: Number(warnings),
                    type: punishment,
                    temp: temp ? ms(temp as string) : null,
                    soft,
                    roleid,
                    days: !!days ? Number(days) : null
                }
            }
        }, (error, raw) => {
            if (error) return ctx.send('I was unable to add the punishment.');
            if (raw.n) {
                return ctx.send(`The punishment was successfully added!`)
            } else {
                return ctx.send('We limit the amount of punishments per server to 15. Please remove some of your punishments before further additions.')
            }
        });
        
    }

    async remove(ctx: Context) {
        const index = ctx.args.get(1);
        if (!index || !/^[0-9]+$/.test(index) || Number(index) < 1)
            return ctx.send('The index of the punishment is required, see the index in `x!settings view`.');
        const settings = await ctx.client.settings.get(ctx.guild.id);
        if (!settings) {
            return ctx.send('There are no punishments!')
        }
        if (Number(index) <= settings!.punishments.length)
            settings!.punishments.splice(Math.round(Number(index))-1, 1);
        settings!.save();
        return ctx.send('Successfully removed the punishment!')
    }

    async set(ctx: Context) {
        const setting = ctx.args.get(1);
        switch (setting) {
            case 'modlog': {
                const channelId = ctx.args.get(2);
                if (!channelId || !/^[0-9]+$/.test(channelId)) return ctx.send('Please set a valid id!')
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        modlog: channelId
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to set the modlog channel');
                    return ctx.send(`The modlog channel has been set to <#${channelId}>`);
                })
                break;
            }
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
                break;
            }
            case 'mutedrole': {
                const mutedRole = ctx.args.get(2);
                if (!mutedRole || !/^[0-9]+$/.test(mutedRole)) return ctx.send('Please set a valid id!')
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        mutedRole
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to change the role id');
                    return ctx.send(`The role id has been set to \`${mutedRole}\``);
                })
                break;
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
            case 'automod.swears' || 'automod.badwords': {
                const wordlist = ctx.args.args.slice(2);
                let enabled = true;

                if (!wordlist || wordlist.length === 0) 
                    enabled = false;

                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.badwords.enabled': enabled,
                        'automod.badwords.wordlist': wordlist
                    }
                }, (error) => {
                    if (error) return ctx.send(`Unable to modify the automod swearing feature`);
                    return ctx.send(stripIndents`Successfully changed the automod badwords settings: ${enabled ? 'Enabled' : 'Disabled'}
                    Words: ${wordlist ? wordlist.join(' ') : 'No Wordlist'}
                    ${!enabled ? `If you didn't mean to disable the feature do: \`x!settings set automod.swears <bad word> <bad word>\` to enable the feature and set up a wordlist.` : ''}`);
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
                return ctx.send('Invalid enabler. (`prefix` | `automod.spam` | `automod.raid` | `automod.swears` | `automod.invites` | `mutedrole` | `modlog`)');
            }
        }
    }

    async reset(ctx: Context) {
        const setting = ctx.args.get(1);
        switch (setting) {
            case 'modlog': {
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        modlog: null
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to disable the modlog')
                    return ctx.send('Mod-log has been disabled!')
                })
                break;
            }
            case 'prefix': {
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        prefix: 'x!'
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to set the prefix to `x!`...');
                    return ctx.send(`The prefix has been set to \`x!\` Run \`x!ping\` to test it!`);
                });
                break;
            }

            case 'mutedrole': {
                this.client.settings.update(ctx.guild.id, {
                    $set: {
                        mutedRole: null
                    }
                }, (error) => {
                    if (error) return ctx.send('I was unable to reset the muted role id.');
                    return ctx.send(`The muted role id was reset successfully!`);
                });
                break;
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
            case 'automod.swears': {
                this.client.settings.update(ctx.guild.id, { 
                    $set: {
                        'automod.badwords.enabled': false,
                        'automod.badwords.wordlist': null
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
                return ctx.send('Invalid disabler. (`prefix` | `automod.spam` | `automod.raid` | `automod.swears` | `automod.invites` | `mutedrole` | `modlog`)');
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
                [prefix]: ${settings!.prefix}
                [mutedrole]: ${settings!.mutedRole ? ctx.guild.roles.get(settings!.mutedRole)!.name : 'None'}
                [modlog]: ${settings!.modlog === null? 'No channel was set.': ctx.guild.channels.get(settings!.modlog)!.name}
                [automod.spam]: ${settings!.automod.spam? 'Yes': 'No'}
                [automod.invites]: ${settings!.automod.spam? 'Yes': 'No'}
                [automod.swears]: ${settings!.automod.badwords.wordlist? settings!.automod.badwords.wordlist.join(', ') : 'Disabled'}
                [automod.raid]: ${settings!.automod.raid? 'Yes': 'No'}
                [punishments]:
                ${settings!.punishments.map((p, i) => `${i+1}. warnings: ${p.warnings}, punishment: ${p.type}, special:${!!p.temp ? ` Time: ${ms(p.temp)}` : ''}${!!p.soft ? ` Soft` : ''}${!!p.roleid ? ` Role: ${!!ctx.guild.roles.get(p.roleid) ? ctx.guild.roles.get(p.roleid)!.name: ''}` : ''}`).join('\n')}
                \`\`\`
            `)
            .setFooter('You\'re viewing the configuration because you didn\'t specify a subcommand', this.client.users.get(ctx.guild.ownerID)!.avatarURL);

        return ctx.embed(embed.build());
    }
}