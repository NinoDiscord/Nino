import { Punishment, PunishmentType } from '../structures/managers/PunishmentManager';
import { Guild, User } from 'eris';
import Event from '../structures/Event';
import Bot from '../structures/Bot';

export default class GuildBanAddEvent extends Event {
	constructor(bot: Bot) {
		super(bot, 'guildBanAdd');
	}

	// TODO: only checks for bans
	// make it so when it's a kick/role add|delete/unban etc
	async emit(guild: Guild, user: User) {
		const punishment = new Punishment(PunishmentType.Ban, {
			moderator: this.bot.client.user
		});

		await this.bot.punishments.punish(
			guild.members.get(user.id) || { id: user.id, guild }, 
			punishment, 
			'Automod (Context Menu)'
		);
	}
}