import { Message, TextChannel } from 'eris';
import { stripIndents } from 'common-tags';
import RatelimitBucket from '../bucket/RatelimitBucket';
import CommandContext from '../Context';
import NinoClient from '../Client';
import PermissionUtils from '../../util/PermissionUtils';

export default class CommandService {
    public client: NinoClient;
    public bucket: RatelimitBucket = new RatelimitBucket();

    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message) {
        this.client.prom.messagesSeen.inc();
        this.client.stats.messagesSeen++;
        
        if (m.author.bot) return;

        const guild = (m.channel as TextChannel).guild;
        const me = guild.members.get(this.client.user.id);
        if (!(m.channel as TextChannel).permissionsOf(me!.id).has('sendMessages'))
            return;

        const mention = new RegExp(`^<@!?${this.client.user.id}> `).exec(m.content);

        let settings = await this.client.settings.get((m.channel as TextChannel).guild.id);
        if (!settings || settings === null) 
            settings = this.client.settings.create((m.channel as TextChannel).guild.id);

        const prefixes = [settings!.prefix, this.client.config.discord.prefix, `${mention}`];


        let prefix: string | null = null;

        // Prefix checks
        for (let pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;

        if (!prefix) return;

        const args = m.content.slice(prefix.length).trim().split(/ +/g);
        const name = args.shift()!;
        const command = this.client.manager.commands.filter((c) =>
            c.name === name || c.aliases!.includes(name)
        );
        const ctx = new CommandContext(this.client, m, args);

        if (command.length > 0) {
            const cmd = command[0];
            const helpFlag = ctx.flags.get('help') || ctx.flags.get('h');
            if (helpFlag && typeof helpFlag === 'boolean') {
                const embed = cmd.help();
                ctx.embed(embed);
                return; // If the --help or --h flag is ran, it'll send the embed and won't run the parent/children commands
            }
            if (cmd.guildOnly && m.channel.type === 1) return void ctx.send('Sorry, but you\'ll be in a guild to execute the `' + cmd.name + '` command.');
            if (cmd.ownerOnly && !this.client.owners.includes(ctx.sender.id)) return void ctx.send(`Sorry, but you will need to be a developer to execute the \`${cmd.name}\` command.`);
            if (cmd.disabled) return void ctx.send(`Command \`${cmd.name}\` is disabled.`);
            if ((me!.permission.allow & 8) === 0 && (cmd.botpermissions & me!.permission.allow) !== cmd.botpermissions) return void ctx.send(`I am missing the following permissions: ${PermissionUtils.toString(cmd.botpermissions & ~(me!.permission.allow))}`);
            if ((m.member!.permission.allow & 8) === 0 && (cmd.userpermissions & m.member!.permission.allow) !== cmd.userpermissions) return void ctx.send(`You are missing the following permissions: ${PermissionUtils.toString(cmd.userpermissions & ~(m.member!.permission.allow))}`);

            this
                .bucket
                .initialize(cmd)
                .check(cmd, ctx.sender, (left) => {
                    const embed = this.client.getEmbed();
                    embed.setDescription(stripIndents`
                        **${ctx.sender.username}**: The command \`${cmd.name}\` is currently on cooldown!
                        Please wait \`${left}\`, please?
                    `);
                    ctx.embed(embed.build());
                });

            try {
                await cmd.run(ctx);
                this.client.stats.commandsExecuted = (this.client.stats.commandsExecuted || 0) + 1;
                this.client.prom.commandsExecuted.inc(); 
                this.client.addCommandUsage(cmd, ctx.sender);
            } catch(ex) {
                const embed = this.client.getEmbed();
                embed
                    .setTitle(`Command ${cmd.name} has failed!`)
                    .setDescription(stripIndents`
                        \`\`\`js
                        ${ex.stack.split('\n')[0]}
                        ${ex.stack.split('\n')[1]}
                        ${ex.stack.split('\n')[2]}
                        ${ex.stack.split('\n')[3]}
                        \`\`\`

                        Contact ${this.client.owners.map(userID => {
                            const user = this.client.users.get(userID)!;
                            if (user)
                                return `${user.username}#${user.discriminator}`;
                            else 
                                return `<@${userID}>`
                        }).join(', ')} at https://discord.gg/7TtMP2n
                    `);
                this.client.logger.error(`Unable to run the "${cmd.name}" command\n${ex.stack}`);
                this.client.report(ex);
            }
        }
    }
}