import { Message, TextChannel, User, Member, Channel } from 'eris';
import { inject, injectable } from 'inversify';
import { stripIndents } from 'common-tags';
import RatelimitBucket from '../bucket/RatelimitBucket';
import PermissionUtils from '../../util/PermissionUtils';
import CommandContext from '../Context';
import NinoCommand from '../Command';
import { TYPES } from '../../types';
import Bot from '../Bot';
import 'reflect-metadata';

export class CommandInvocation {
  public command: NinoCommand;
  public onetime: boolean;
  public ctx: CommandContext;

  constructor(command: NinoCommand, ctx: CommandContext, onetime: boolean = false) {
    this.command = command;
    this.onetime = onetime;
    this.ctx = ctx;
  }

  get user() {
    return this.ctx.member || this.ctx.sender;
  }

  get bot() {
    return this.ctx.guild ? this.ctx.me : this.ctx.client.user;
  }

  get channel() {
    return this.ctx.channel;
  }

  /**
   * Returns an error string if cannot invoke, otherwise it will return undefined.
   */
  canInvoke() {
    if (this.command.guildOnly && [1, 3].includes(this.channel.type)) return `Sorry, but you need to be in a guild to execute the \`${this.command.name}\` command.`;
    if (this.command.ownerOnly && !this.command.bot.owners.includes(this.user.id)) return `Sorry, but you need to be a developer to execute the \`${this.command.name}\` command.`;
    if (this.command.disabled && !this.onetime) return `Currently, command \`${this.command.name}\` is globally disabled`;

    if (this.bot instanceof Member && !PermissionUtils.overlaps(this.bot.permission.allow, this.command.botPermissions)) {
      const bytecode = this.command.userPermissions & ~this.bot.permission.allow;
      return `I am missing the following permissions: ${PermissionUtils.toString(bytecode)}`;
    }

    if (this.user instanceof Member && !PermissionUtils.overlaps(this.user.permission.allow, this.command.userPermissions)) {
      const bytecode = this.command.userPermissions & ~this.user.permission.allow;
      return `You are missing the following permissions: ${PermissionUtils.toString(bytecode)}`;
    }

    return undefined;
  }
}

@injectable()
export default class CommandService {
  public bucket: RatelimitBucket = new RatelimitBucket();
  public bot: Bot;
  
  constructor(
    @inject(TYPES.Bot) bot: Bot
  ) {
    this.bot = bot;
  }

  /**
   * Parses the message content and returns a command invocation.
   * @param args the message arguments
   * @param m the message object
   */
  getCommandInvocation(ctx: CommandContext) {
    if (!ctx.args.args.length) return undefined;

    const name = ctx.args.args.shift()!;
    const command = this.bot.manager.getCommand(name);
    if (command) {
      const flag = ctx.flags.get('help') || ctx.flags.get('h');
      if (flag && typeof flag === 'boolean') {
        ctx.flags.flags = '';
        ctx.args.args = [command.name];
        const help = this.bot.manager.commands.get('help')!;
        return new CommandInvocation(help, ctx, true); 
      }
      return new CommandInvocation(command, ctx, false);
    }

    return undefined;
  }

  async handle(m: Message) {
    this.bot.prometheus.messagesSeen.inc();
    this.bot.statistics.messagesSeen++;
    if (m.author.bot) return;

    const guild = (m.channel as TextChannel).guild;
    const me = guild.members.get(this.bot.client.user.id);
    if (!(m.channel as TextChannel).permissionsOf(me!.id).has('sendMessages')) return;

    const mention = new RegExp(`^<@!?${this.bot.client.user.id}> `).exec(m.content);
    const settings = await this.bot.settings.getOrCreate(guild.id);
    const prefixes = [
      settings!.prefix,
      this.bot.config.discord.prefix,
      `${mention}`,
      'nino '
    ];

    let prefix: string | null = null;
    for (let pre of prefixes) if (m.content.startsWith(pre)) prefix = pre;

    if (!prefix) return;

    const args = m.content.slice(prefix.length).trim().split(/ +/g);
    const ctx = new CommandContext(this.bot, m, args);
    const invoked = this.getCommandInvocation(ctx);

    if (invoked) {
      const message = invoked.canInvoke();
      if (message) {
        const embed = this.bot.getEmbed()
          .setTitle(`Unable to run ${invoked.command.name}!`)
          .setDescription(message);

        return void ctx.embed(embed.build());
      }

      this.bucket
        .initialize(invoked.command)
        .check(invoked.command, invoked.user instanceof Member ? invoked.user.user : invoked.user, left => {
          ctx.send(`**${invoked.user.username}**, the command \`${invoked.command.name}\` is on cooldown for \`${left}\`!`);
        });

      try {
        await invoked.command.run(ctx);
        this.bot.prometheus.commandsExecuted.inc();
        this.bot.statistics.increment(invoked.command);
        this.bot.logger.info(`Ran command "${prefix}${invoked.command.name}" for ${ctx.sender.username}#${ctx.sender.discriminator} in ${ctx.guild ? `guild ${ctx.guild.name}` : 'DMs'}, now at ${this.bot.statistics.commandsExecuted.toLocaleString()} commands executed!`);
      } catch(ex) {
        const embed = this.bot.getEmbed();
        const owners = this.bot.owners.map(userID => {
          const user = this.bot.client.users.get(userID)!;
          if (user) return `${user.username}#${user.discriminator}`;
          else return `<@${userID}>`;
        }).join(', ');

        embed
          .setTitle(`Command ${invoked.command.name} has failed`)
          .setDescription(stripIndents`
            The error that occured has been logged into our systems.
            If the issue persists, contact ${owners} at https://discord.gg/7TtMP2n
          `);

        this.bot.logger.error(`Unable to run the '${invoked.command.name}' command!`, ex.stack ? ex.stack : ex.message);
        this.bot.report(ex);
        return ctx.embed(embed.build());
      }
    }
  }
}
