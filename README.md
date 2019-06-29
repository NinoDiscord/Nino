# Nino

Moderation-based Discord bot created for the official [hackweek](https://discord.gg/hackweek).

Invite the public version [here](https://discordapp.com/oauth2/authorize?client_id=531613242473054229&scope=bot)

Join the support server [here](https://discord.gg/7TtMP2n)

# How to use the bot?

x!settings will help you manage the settings for each guild. 

View the settings by running x!settings view

1. Adding and removing a punishment:
```
x!settings add <amount of warnings> <punishment> [--soft] [--temp <time can be x timeunit or x(initial of timeunit)>] [--days <amount of days to delete messages of>] [--roleid <role id>]
```
Example (This will add a punishment: a soft ban after 3 warnings):
```
x!settings add 3 ban --soft
```

You can have as many punishments as you like! but remember, some punishments can collide with others! Use them cautiously!

To remove a punishment you run (the index is the place of the punishment in the list in x!settings view):
```
x!settings remove <index>
```

2. Enabling and Disabling other settings
```
x!settings set <setting> <value>
```
Example: Enabling anti-spam in automod:
```
x!settings set automod.spam true
```
Example: Disabling anti-spam in automod:
```
x!settings set automod.spam false
```

3. Resetting to defaults:
```
x!settings reset <setting>
```

# Features

* Auto Moderation - Prevents raids, spam, ads and swears!
* Lockdown command - locks one, multiple or all channels for a specific role downwards
* Moderation commands - many moderation commands to simplify your moderators' work.
* Moderation Log and Cases - easy and organized way of seeing the actions done by you and your mods! 
* Advanced warning system and auto punishments - automatically punish those who commit offenses!

## Setting up the bot

1. Clone the repository using Git: ``git clone https://github.com/auguwu/nino``
2. Install dependencies with NPM (included in Node.js): ``npm i``
3. Create an application.yml file in your working directory (see the example for more information)
4. Compile TypeScript (install TypeScript with ``npm i -g typescript``): ``tsc``
5. Run the bot in the `dist` directory: ``node bot.js``
6. 4 and 5 can be bypassed by running npm run main.

Bot credentials (+ extra information) and personal touches are obviously your responsibility. You should know this by now, I hope.

# Example application.yml

```yaml
environment: "development"
databaseUrl: "mongodb://localhost:27017/database"
discord:
  token: "TOKEN"
  prefix: "x!"
redis:
    host: 'localhost'
    port: 6379
```

## Requirements

* [Node.js](https://nodejs.org)
* [Git](https://git-scm.com)

## Participants

* August#5820 (Lead) ([GitHub](https://github.com/auguwu))
* Kyle#9810 ([GitHub](https://github.com/dvhe))
* dondish#0001 ([GitHub](https://github.com/dondish))
* Wesselgame#0498 ([GitHub](https://github.com/PassTheWessel))
* ohlookitsderpy#3939 ([GitHub](https://github.com/ohlookitsderpy))
