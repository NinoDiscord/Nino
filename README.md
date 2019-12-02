# Nino [![Build Status](https://travis-ci.org/auguwu/Nino.svg?branch=master)](https://travis-ci.org/auguwu/Nino)[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Moderation-based Discord bot initally created for the Discord hackweek, now it is still regularly maintained.

Invite the public version [here](https://discordapp.com/oauth2/authorize?client_id=531613242473054229&scope=bot)

Join the support server (Dondish Central) [here](https://discord.gg/pEKkg9r)

# How to use the bot?

Check out the [wiki](https://github.com/auguwu/Nino/wiki)!

# Contributing
First, check our [contributing guidelines](https://github.com/auguwu/nino/blob/master/CONTRIBUTING.md) and [code of conduct](https://github.com/auguwu/nino/blob/master/CODE_OF_CONDUCT.md).

# Features

* Auto Moderation - Prevents raids, spam, ads and many more!
* Lockdown command - locks one, multiple or all channels for a specific role downwards
* Moderation commands - many moderation commands to simplify your moderators' work.
* Moderation Log and Cases - easy and organized way of seeing the actions done by you and your mods! 
* Advanced warning system and auto punishments - automatically punish those who commit offenses!

# Installation

## Requirements

* [Node.js](https://nodejs.org)
* [Git](https://git-scm.com) (optional)
* [MongoDB](https://www.mongodb.com)
* [Redis](https://redis.io)

## Setting up the bot

1. Clone the repository using Git: ``git clone https://github.com/auguwu/nino`` (If you don't have Git, just go to "Clone or download" and click "Download ZIP" then extract)
2. Install dependencies with NPM (included in Node.js): ``npm i`` (or with [Yarn](https://yarnpkg.com) ``yarn``)
3. Create an application.yml file in your working directory and fill it in (see the example for more information)
4. Compile TypeScript (install TypeScript with ``npm i -g typescript`` or with Yarn ``yarn global add typescript``): ``tsc``
5. Run the bot in the `dist` directory: ``node bot.js``
6. Invite the bot to your server: ``https://discordapp.com/oauth2/authorize?client_id=BOTIDHERE&scope=bot`` (replace "BOTIDHERE" with your Discord bot's client id)

(4 and 5 can be bypassed by running ``npm run main``)

Bot credentials (+ extra information) and personal touches are obviously your responsibility. You should know this by now, I hope.

## Example application.yml

```yaml
environment: 'development'
databaseUrl: 'mongodb://localhost:27017/database'
mode: 'development'
sentryDSN: 'Your Sentry DSN'
discord:
  token: 'TOKEN'
  prefix: 'x!'
redis:
  host: 'localhost'
  port: 6379
```

# Credits

## Maintainers
* August#5820 (Lead) ([GitHub](https://github.com/auguwu))
* dondish#0001 (Development Lead) ([GitHub](https://github.com/dondish))

## Hackweek Participants

* August#5820 (Owner) ([GitHub](https://github.com/auguwu))
* dondish#0001 ([GitHub](https://github.com/dondish))
* Kyle#9810 ([GitHub](https://github.com/dvhe))
* Wesselgame#0498 ([GitHub](https://github.com/PassTheWessel))
* ohlookitsderpy#3939 ([GitHub](https://github.com/ohlookitsderpy))
