import { Message, TextChannel } from 'eris';
import { stripIndents } from 'common-tags';
import RatelimitBucket from '../bucket/RatelimitBucket';
import { Collection } from '@augu/immutable';
import { Subcommand } from '../Command';
import CommandContext from '../Context';
import NinoClient from '../Client';

export interface ISubcommand {
    is: boolean;
    instance: Subcommand | null;
}

export default class CommandService {
    public client: NinoClient;
    public bucket: RatelimitBucket = new RatelimitBucket();

    constructor(client: NinoClient) {
        this.client = client;
    }

    async handle(m: Message) {
        this.client.stats.messagesSeen++;
        if (m.author.bot) return;

        const guild = await this.client.settings.get((m.channel as TextChannel).guild.id);
        if (!guild) this.client.settings.create((m.channel as TextChannel).guild.id);

        let prefix: string | null = null;
        const mention = new RegExp(`^<@!?${this.client.user.id}> `).exec(m.content);
        const prefixes = [guild!.prefix, this.client.config.discord.prefix, `${mention}`];

        // Prefix checks
        for (let pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;

        if (!prefix) return;

        const args = m.content.slice(prefix.length).trim().split(/ +/g);
        const name = args.shift()!;
        const command = this.client.manager.commands.filter((c) =>
            c.name === name || c.aliases!.includes(name)
        );
        const ctx = new CommandContext(this.client, m, args);
        const subcommand: ISubcommand = {
            is: false,
            instance: null
        };

        if (command.length > 0) {
            if (args.length) {
                for (const arg of args) {
                    if (command[0].subcommands.length && command[0].subcommands.find(sub => sub.name === arg)) {
                        subcommand.is = true;
                        subcommand.instance = command[0].subcommands.find(s => s.name === arg)!;
                    }
                }
            }

            const cmd = command[0];
            if (cmd.guildOnly && m.channel.type === 1) return void ctx.send('Sorry, but you\'ll be in a guild to execute the `' + cmd.name + '` command.');
            if (cmd.ownerOnly && !this.client.owners.includes(ctx.sender.id)) return void ctx.send(`Sorry, but you will need to be a developer to execute the \`${cmd.name}\` command.`);
            if (cmd.disabled) return void ctx.send(`Command \`${cmd.name}\` is disabled.`);

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
                if (subcommand.is) {
                    args.pop();
                    await subcommand.instance!.run(this.client, ctx);
                    this.client.addCommandUsage(cmd, ctx.sender);
                    return; // This is here so we won't run the parent command
                }

                await cmd.run(ctx);
                this.client.addCommandUsage(cmd, ctx.sender);
            } catch(ex) {
                const embed = this.client.getEmbed();
                embed
                    .setTitle(`Command ${cmd.name} (#${cmd.id}) has failed!`)
                    .setDescription(stripIndents`
                        \`\`\`js
                        ${ex.stack.split('\n')[0]}
                        ${ex.stack.split('\n')[1]}
                        ${ex.stack.split('\n')[2]}
                        ${ex.stack.split('\n')[3]}
                        \`\`\`

                        Contact ${this.client.owners.map(userID => {
                            const user = this.client.users.get(userID)!;
                            return `${user.username}#${user.discriminator}`;
                        }).join(', ')} at https://discord.gg/7TtMP2n
                    `);
                this.client.logger.error(`Unable to run the "${cmd.name}" (#${cmd.id}) command\n${ex.stack}`);
            }
        }
    }
}