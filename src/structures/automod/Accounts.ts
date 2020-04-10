import { Punishment, PunishmentType } from '../managers/PunishmentManager';
import PermissionUtils from '../../util/PermissionUtils';
import { Member } from 'eris';
import RedisQueue from '../../util/RedisQueue';
import Bot from '../Bot';
import w from 'wumpfetch';

export default class AccountsAutomod {
  public bot: Bot;
  constructor(bot: Bot) {
    this.bot = bot;
  }

  async handle(m: Member) {
    const guild = m.guild;
    const me = guild.members.get(this.bot.client.user.id)!;
    if (!PermissionUtils.above(me, m) || m.bot || Date.now() - m.createdAt > 7 * 86400000) return false;

    const settings = await this.bot.settings.get(guild.id);
    if (!settings || !settings.automod.raid) return false;

    const discrim: any = m.user.discriminator as any % 5;
    const bucket = new RedisQueue(this.bot.redis, `accounts:${guild.id}`);
    await bucket.push(`${Date.now()}:${m.id}`);

    if (discrim === m.user.defaultAvatar) {
      const len = await bucket.length();
      if (len >= 3) {
        const old = Number.parseInt(await bucket.pop());
        if (Date.now() - old <= 1000) {
          do {
            await this.bot.punishments.punish(m, new Punishment(PunishmentType.Ban, { moderator: me.user }), '[Automod] Raid detected');
          
            const id = (await bucket.pop()).split(':')[1];
            m = guild.members[id];
          } while ((await bucket.length()) > 0);
  
          return true;
        }
      }
    }

    if (this.bot.config.ksoft === undefined) {
      this.bot.logger.warn('Missing "ksoft" key, will not detect if the user is banned or not!');
      return false;
    } else {
      const req = await w({
        method: 'GET',
        url: `https://api.ksoft.si/bans/info?user=${m.id}`
      }).header({
        Authorization: `Bearer ${this.bot.config.ksoft}`
      }).send();

      try {
        const data = req.json();
        console.log(data);
        if (data.code || data.detail) return false;

        const punishment = new Punishment(PunishmentType.Ban, {
          moderator: me.user
        });

        await this.bot.punishments.punish(m, punishment, '[Automod] User was banned on KSoft.Si');
      } catch(ex) {
        this.bot.logger.warn('Unable to serialize data');
        return false;
      }
    }
  }
}