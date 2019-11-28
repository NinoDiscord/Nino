import { Message, TextChannel, User, Member, Channel } from 'eris';
import { stripIndents } from 'common-tags';
import RatelimitBucket from '../bucket/RatelimitBucket';
import CommandContext from '../Context';
import NinoClient from '../Client';
import PermissionUtils from '../../util/PermissionUtils';
import NinoCommand from '../Command';

export class CommandInvocation {
    command: NinoCommand;
    ctx: CommandContext;
    user: Member | User;
    bot: Member | User;
    channel: Channel;

    constructor(command: NinoCommand, user: Member | User, bot: Member | User, channel: Channel, ctx: CommandContext) {
        this.command = command;
        this.user = user;
        this.bot = bot;
        this.channel = channel;
        this.ctx = ctx;
    }

    /**
     * Returns an error string if cannot invoke, otherwise it will return undefined.
     */
    canInvoke(): string | undefined {
        if (this.command.guildOnly && this.channel.type === 1) return 'Sorry, but you need to be in a guild to execute the `' + this.command.name + '` command.';
        if (this.command.ownerOnly && !this.command.client.owners.includes(this.user.id)) return `Sorry, but you need to be a developer to execute the \`${this.command.name}\` command.`;
        if (this.command.disabled) return `Command \`${this.command.name}\` is disabled.`;
        if (this.bot instanceof Member && !PermissionUtils.overlaps(this.bot.permission.allow, this.command.userpermissions)) return `I am missing the following permissions: ${PermissionUtils.toString(this.command.botpermissions & ~(this.bot.permission.allow))}`;
        if (this.user instanceof Member && !PermissionUtils.overlaps(this.user.permission.allow, this.command.userpermissions)) return `You are missing the following permissions: ${PermissionUtils.toString(this.command.userpermissions & ~(this.user.permission.allow))}`;
        return undefined;
    }

    /**
     * Executes the command with the invocation context
     */
    async execute(): Promise<any> {
        return this.command.run(this.ctx);
    }
}

export default class CommandService {
    public client: NinoClient;
    public bucket: RatelimitBucket = new RatelimitBucket();

    constructor(client: NinoClient) {
        this.client = client;
    }

    getCommandInvocation(args: string[], m: Message): CommandInvocation | undefined {
        if (args.length == 0) {
            return undefined;
        }
        const name = args.shift()!;
        const command = this.client.manager.commands.filter((c) =>
            c.name === name || c.aliases!.includes(name)
        );
        const ctx = new CommandContext(this.client, m, args);

        if (command.length > 0) {
            const cmd = command[0];
            const helpFlag = ctx.flags.get('help') || ctx.flags.get('h');
            if (helpFlag && typeof helpFlag === 'boolean') {
                ctx.flags.flags = '';
                ctx.args.args = [cmd.name];
                return new CommandInvocation(this.client.manager.commands.get('help')!, m.member || m.author, m.member ?  m.member!.guild.members[ctx.client.user.id] : ctx.client.user, m.channel, ctx); // If the --help or --h flag is ran, it'll send the embed and won't run the parent/children commands
            }
            return new CommandInvocation(cmd, m.member || m.author, m.member ?  m.member!.guild.members[ctx.client.user.id] : ctx.client.user, m.channel, ctx);
        }
        return undefined;
    }

    async handle(m: Message) {
        this.client.prom.messagesSeen.inc();
        this.client.stats.messagesSeen++;
        
        if (m.author.bot) return;

        const guild = (m.channel as TextChannel).guild;
        const me = guild.members.get(this.client.user.id);
        if (!(m.channel as TextChannel).permissionsOf(me!.id).has('sendMessages')) return;

        const mention = new RegExp(`^<@!?${this.client.user.id}> `).exec(m.content);

        let settings = await this.client.settings.getOrCreate((m.channel as TextChannel).guild.id);

        const prefixes = [settings!.prefix, this.client.config.discord.prefix, `${mention}`];


        let prefix: string | null = null;

        // Prefix checks
        for (let pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;

        if (!prefix) return;

        const args = m.content.slice(prefix.length).trim().split(/ +/g);
        const invocation: CommandInvocation | undefined = this.getCommandInvocation(args, m);

        if (invocation) {
            const invoketry = invocation.canInvoke();
            if (invoketry) return void invocation.ctx.send(invoketry);

            this
                .bucket
                .initialize(invocation.command)
                .check(invocation.command, (invocation.user instanceof Member) ? invocation.user.user : invocation.user, (left) => {
                    const embed = this.client.getEmbed();
                    embed.setDescription(stripIndents`
                        **${invocation.user.username}**: The command \`${invocation.command.name}\` is currently on cooldown!
                        Please wait \`${left}\`!
                    `);
                    invocation.ctx.embed(embed.build());
                });

            try {
                await invocation.execute();
                this.client.stats.commandsExecuted = (this.client.stats.commandsExecuted || 0) + 1;
                this.client.prom.commandsExecuted.inc(); 
                this.client.addCommandUsage(invocation.command, invocation.ctx.sender);
            } catch(ex) {
                const embed = this.client.getEmbed();
                embed
                    .setTitle(`Command ${invocation.command.name} has failed!`)
                    .setDescription(stripIndents`
                        The error has been automatically logged in our systems.
                        If the issue persists contact us!
                        Available Contacts: ${this.client.owners.map(userID => {
                            const user = this.client.users.get(userID)!;
                            if (user)
                                return `${user.username}#${user.discriminator}`;
                            else 
                                return `<@${userID}>`;
                        }).join(', ')} at https://discord.gg/7TtMP2n
                    `);
                this.client.logger.log('error', `Unable to run the '${invocation.command.name}' command\n${ex.stack}`);
                this.client.report(ex);
                return invocation.ctx.embed(embed.build());
            }
        }
    }
}