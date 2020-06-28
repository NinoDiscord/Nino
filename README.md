# Nino 
[![Build Status](https://travis-ci.org/auguwu/Nino.svg?branch=master)](https://travis-ci.org/auguwu/Nino)

> :hammer: **| Moderation-based Discord bot initally created for the Discord hackweek, now it is still regularly maintained.**
>
> [Website](https://nino.augu.dev) **|** [Support Server](https://discord.gg/pEKkg9r) **|** [Invite](https://discordapp.com/oauth2/authorize?client_id=531613242473054229&scope=bot)

## How to use the bot?
Check out the [wiki](https://github.com/NinoDiscord/Nino/wiki)!

## Contributing
First, check our [contributing guidelines](https://github.com/NinoDiscord/Nino/blob/master/CONTRIBUTING.md) and [code of conduct](https://github.com/NinoDiscord/Nino/blob/master/CODE_OF_CONDUCT.md).

## Features

* Auto Moderation - Prevents raids, spam, ads and many more!
* Lockdown command - locks one, multiple or all channels for a specific role downwards
* Moderation commands - many moderation commands to simplify your moderators' work.
* Moderation Log and Cases - easy and organized way of seeing the actions done by you and your mods! 
* Advanced warning system and auto punishments - automatically punish those who commit offenses!

## Installation
### Requirements
* [Node.js](https://nodejs.org) (Node v10 or higher is supported!)
* [Git](https://git-scm.com) (optional)
* [MongoDB](https://www.mongodb.com)
* [Redis](https://redis.io)
* [Sentry](https://sentry.io) (optional)

### Setting up the bot
1. Clone the repository using Git: ``git clone https://github.com/NinoDiscord/Nino`` (If you don't have Git, just go to "Clone or download" and click "Download ZIP" then extract)
2. Install dependencies with NPM (included in Node.js): ``npm i`` (or with [Yarn](https://yarnpkg.com) ``yarn``)
3. Create an application.yml file in your working directory and fill it in (see the example for more information)
4. Compile TypeScript (install TypeScript with ``npm i -g typescript`` or with Yarn ``yarn global add typescript``): ``tsc``
5. Run the bot in the `dist` directory: ``node bot.js``
6. Invite the bot to your server: ``https://discordapp.com/oauth2/authorize?client_id=BOTIDHERE&scope=bot`` (replace "BOTIDHERE" with your Discord bot's client id)

(4 and 5 can be bypassed by running ``npm run main``)

Bot credentials (+ extra information) and personal touches are obviously your responsibility. You should know this by now, I hope.

### Example application.yml
```yaml
environment: 'development'
databaseUrl: 'mongodb://localhost:27017/database'
mode: 'development'
sentryDSN: 'Your Sentry DSN'
discord:
  token: 'TOKEN'
  prefix: 'x!'

# options from ioredis
# read here: https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options
redis:
  host: 'localhost'
  port: 6379
```

## Cloning/Using Source Code
If you wish to use the source code for a project, please add proper crediting in your code using the LICENSE displayed [here](/LICENSE).

## Credits
### Maintainers
* August#5820 (Lead) ([GitHub](https://github.com/auguwu))
* dondish#0001 (Development Lead) ([GitHub](https://github.com/dondish))

### Hackweek Participants
* August#5820 (Owner) ([GitHub](https://github.com/auguwu))
* dondish#8072 ([GitHub](https://github.com/dondish))
* Kyle#9810 ([GitHub](https://github.com/dvhe))
* Wesselgame#0498 ([GitHub](https://github.com/PassTheWessel))
* ohlookitsderpy#9721 ([GitHub](https://github.com/ohlookitsderpy))
