import { Message, TextChannel, User, Member, Channel } from 'eris';
import { stripIndents } from 'common-tags';
import RatelimitBucket from '../bucket/RatelimitBucket';
import CommandContext from '../Context';
import Bot from '../Bot';
import PermissionUtils from '../../util/PermissionUtils';
import NinoCommand from '../Command';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import 'reflect-metadata';

export class CommandInvocation {
  command: NinoCommand;
  ctx: CommandContext;
  onetime: boolean;

  constructor(
    command: NinoCommand,
    ctx: CommandContext,
    onetime: boolean = false
  ) {
    this.command = command;
    this.ctx = ctx;
    this.onetime = onetime;
  }

  get user(): Member | User {
    return this.ctx.member || this.ctx.sender;
  }

  get bot(): Member | User {
    if (this.ctx.guild) {
      return this.ctx.me;
    }
    return this.ctx.client.user;
  }

  get channel(): Channel {
    return this.ctx.channel;
  }

  /**
   * Returns an error string if cannot invoke, otherwise it will return undefined.
   */
  canInvoke(): string | undefined {
    if (this.command.guildOnly && this.channel.type !== 1)
      return (
        'Sorry, but you need to be in a guild to execute the `' +
        this.command.name +
        '` command.'
      );
    if (
      this.command.ownerOnly &&
      !this.command.bot.owners.includes(this.user.id)
    )
      return `Sorry, but you need to be a developer to execute the \`${this.command.name}\` command.`;
    if (this.command.disabled && !this.onetime)
      return `Command \`${this.command.name}\` is disabled.`;
    if (
      this.bot instanceof Member &&
      !PermissionUtils.overlaps(
        this.bot.permission.allow,
        this.command.userpermissions
      )
    )
      return `I am missing the following permissions: ${PermissionUtils.toString(
        this.command.botpermissions & ~this.bot.permission.allow
      )}`;
    if (
      this.user instanceof Member &&
      !PermissionUtils.overlaps(
        this.user.permission.allow,
        this.command.userpermissions
      )
    )
      return `You are missing the following permissions: ${PermissionUtils.toString(
        this.command.userpermissions & ~this.user.permission.allow
      )}`;
    return undefined;
  }

  /**
   * Executes the command with the invocation context
   */
  async execute(): Promise<any> {
    return this.command.run(this.ctx);
  }
}

@injectable()
export default class CommandService {
  public bot: Bot;
  public bucket: RatelimitBucket = new RatelimitBucket();

  constructor(@inject(TYPES.Bot) bot: Bot) {
    this.bot = bot;
  }

  /**
   * Parses the message content and returns a command invocation.
   * @param args the message arguments
   * @param m the message object
   */
  getCommandInvocation(ctx: CommandContext): CommandInvocation | undefined {
    if (ctx.args.args.length == 0) {
      return undefined;
    }
    const name = ctx.args.args.shift()!;
    const cmd = ctx.bot.manager.getCommand(name);

    if (cmd) {
      const helpFlag = ctx.flags.get('help') || ctx.flags.get('h');
      if (helpFlag && typeof helpFlag === 'boolean') {
        ctx.flags.flags = '';
        ctx.args.args = [cmd.name];
        return new CommandInvocation(
          this.bot.manager.commands.get('help')!,
          ctx,
          true
        ); // If the --help or --h flag is ran, it'll send the embed and won't run the parent/children commands
      }
      return new CommandInvocation(cmd, ctx);
    }
    return undefined;
  }

  async handle(m: Message) {
    this.bot.prom.messagesSeen.inc();
    this.bot.stats.messagesSeen++;

    if (m.author.bot) return;

    const guild = (m.channel as TextChannel).guild;
    const me = guild.members.get(this.bot.client.user.id);
    if (!(m.channel as TextChannel).permissionsOf(me!.id).has('sendMessages'))
      return;

    const mention = new RegExp(`^<@!?${this.bot.client.user.id}> `).exec(
      m.content
    );

    let settings = await this.bot.settings.getOrCreate(
      (m.channel as TextChannel).guild.id
    );

    const prefixes = [
      settings!.prefix,
      this.bot.config.discord.prefix,
      `${mention}`,
    ];

    let prefix: string | null = null;

    // Prefix checks
    for (let pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;

    if (!prefix) return;

    const args = m.content
      .slice(prefix.length)
      .trim()
      .split(/ +/g);

    const ctx = new CommandContext(this.bot, m, args);
    const invocation: CommandInvocation | undefined = this.getCommandInvocation(
      ctx
    );

    if (invocation) {
      const invoketry = invocation.canInvoke();
      if (invoketry) return void invocation.ctx.send(invoketry);

      this.bucket
        .initialize(invocation.command)
        .check(
          invocation.command,
          invocation.user instanceof Member
            ? invocation.user.user
            : invocation.user,
          left => {
            const embed = this.bot.getEmbed();
            embed.setDescription(stripIndents`
                        **${invocation.user.username}**: The command \`${invocation.command.name}\` is currently on cooldown!
                        Please wait \`${left}\`!
                    `);
            invocation.ctx.embed(embed.build());
          }
        );

      try {
        await invocation.execute();
        this.bot.stats.commandsExecuted =
          (this.bot.stats.commandsExecuted || 0) + 1;
        this.bot.prom.commandsExecuted.inc();
        this.bot.addCommandUsage(invocation.command, invocation.ctx.sender);
      } catch (ex) {
        const embed = this.bot.getEmbed();
        embed.setTitle(`Command ${invocation.command.name} has failed!`)
          .setDescription(stripIndents`
                        The error has been automatically logged in our systems.
                        If the issue persists contact us!
                        Available Contacts: ${this.bot.owners
                          .map(userID => {
                            const user = this.bot.client.users.get(userID)!;
                            if (user)
                              return `${user.username}#${user.discriminator}`;
                            else return `<@${userID}>`;
                          })
                          .join(', ')} at https://discord.gg/7TtMP2n
                    `);
        this.bot.logger.log(
          'error',
          `Unable to run the '${invocation.command.name}' command\n${ex.stack}`
        );
        this.bot.report(ex);
        return invocation.ctx.embed(embed.build());
      }
    }
  }
}
