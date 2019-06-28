/*
    async run(ctx: Context) {
        if (!ctx.args.has(0)) return ctx.send('Sorry buy you will need to specify a user.');

        const user = await this.client.getRESTUser(ctx.args.get(0));
        const member = ctx.guild.members.get(user.id);

        if (!member || member === null) return ctx.send(`User \`${user.username}#${user.discriminator}\` is not in this guild?`);

        let reason = (ctx.flags.get('reason') || ctx.flags.get('r'));
        if (typeof reason === 'boolean') return ctx.send('You will need to specify a reason');

        const punishment = new Punishment(PunishmentType.Kick, {
            moderator: ctx.sender
        });

        await this.client.punishments.addWarning(member!);
        await this.client.punishments.punish(member!, punishment, (reason as string));
    }*/