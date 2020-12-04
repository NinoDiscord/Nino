import { inject, injectable } from 'inversify';
import { Client, Constants } from 'eris';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import CaseSettingsService from '../../structures/services/settings/CaseSettingsService';
import GuildSettingsService from '../../structures/services/settings/GuildSettingsService';
import PunishmentService from '../../structures/services/PunishmentService';
import ms from 'ms';

@injectable()
export default class ReasonCommand extends Command {
  constructor(
      @inject(TYPES.Bot) bot: Bot,
      @inject(TYPES.CaseSettingsService) private caseSettingsService: CaseSettingsService,
      @inject(TYPES.Client) private client: Client,
      @inject(TYPES.GuildSettingsService) private guildSettingsService: GuildSettingsService,
      @inject(TYPES.PunishmentService) private punishmentService: PunishmentService
  ) {
    super(bot, {
      name: 'reason',
      description: 'Updates a case\'s reason',
      usage: '<caseID> <reason>',
      aliases: ['update'],
      category: Module.Moderation,
      guildOnly: true,
      userPermissions: Constants.Permissions.kickMembers,
      botPermissions: Constants.Permissions.manageMessages
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('commands.moderation.reason.noCase');
    if (!ctx.args.has(1)) return ctx.sendTranslate('commands.moderation.reason.noReason');

    const id = ctx.args.get(0);
    const reason = ctx.args.slice(1).join(' ');
    const guild = ctx.guild!;

    const caseID = Number(id);
    if (isNaN(caseID)) return ctx.sendTranslate('global.nan');

    const caseModel = await this.caseSettingsService.get(guild.id, caseID);
    const settings = await this.guildSettingsService.get(guild.id);
    let time: number | null = null;

    if (!caseModel || !caseModel.message) return ctx.sendTranslate('commands.moderation.reason.invalid', { id });
    if (ctx.flags.has('time') || ctx.flags.has('t')) {
      if (caseModel.type !== 'mute' || (<any> caseModel.type) !== 'unban') return ctx.sendTranslate('commands.moderation.reason.notMute', { id });

      const t = ctx.flags.get('time') || ctx.flags.get('t');
      if (typeof t === 'boolean') return ctx.sendTranslate('global.invalidFlag.string');

      time = ms(t);
    }

    caseModel.reason = reason;
    if (time !== null) {
      caseModel.time = time;

      const hasTimeout = await this.bot.timeouts.hasTimeout(caseModel.victim, ctx.guild!, 'unmute');
      if (!hasTimeout) await this.bot.timeouts.addTimeout(caseModel.victim, ctx.guild!, 'unmute', time);
      else {
        await this.bot.timeouts.cancelTimeout(caseModel.victim, ctx.guild!, 'unmute');
        await this.bot.timeouts.addTimeout(caseModel.victim, ctx.guild!, 'unmute', time);
      }
    }

    await this.caseSettingsService.update(ctx.guild!.id, parseInt(id), {
      $set: {
        'reason': reason,
        'time': time
      }
    }, async (error) => {
      if (error) return ctx.sendTranslate('commands.moderation.reason.error', { id });

      const message = await this.client.getMessage(settings!.modlog, caseModel.message!);
      await this.punishmentService.editModlog(caseModel, message);

      return ctx.sendTranslate('commands.moderation.reason.edited', {
        reason,
        id
      });
    });
  }
}
