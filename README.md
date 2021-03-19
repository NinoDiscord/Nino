# Nino
> :hammer: **Advanced and cute moderation discord bot as an entry of Discord's Hack Week!**
>
> [Website](https://nino.floofy.dev) **|** [Support](https://discord.gg/JjHGR6vhcG) **|** [Invite Me!](https://discord.com/oauth2/authorize?client_id=531613242473054229&scope=bot)

## NOTICE
This branch is where v1 is being written from the ground up! Most of the README section will be replaced once we are done with it.

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
* [Node.js](https://nodejs.org) (Node v14 or higher is supported!)
* [Git](https://git-scm.com) (optional)
* [MongoDB](https://www.mongodb.com)
* [Redis](https://redis.io)
* [Sentry](https://sentry.io) (optional)
* [Docker](https://docker.com) (optional)

### Setting up the bot (normally)
1. Clone the repository using Git: ``git clone https://github.com/NinoDiscord/Nino`` (If you don't have Git, just go to "Clone or download" and click "Download ZIP" then extract)
2. Install dependencies with NPM (included in Node.js): ``npm i`` (or with [Yarn](https://yarnpkg.com) ``yarn``)
3. Create an application.yml file in your working directory and fill it in (see the example for more information)
4. Compile TypeScript (install TypeScript with ``npm i -g typescript`` or with Yarn ``yarn global add typescript``): ``tsc``
5. Run the bot in the `dist` directory: ``node bot.js``
6. Invite the bot to your server: ``https://discordapp.com/oauth2/authorize?client_id=BOTIDHERE&scope=bot`` (replace "BOTIDHERE" with your Discord bot's client id)

(4 and 5 can be bypassed by running ``npm run main``)

Bot credentials (+ extra information) and personal touches are obviously your responsibility. You should know this by now, I hope.

### Notes when using Docker
1. Use the example application.yml but change ``localhost`` in the URL for the database to ``database`` and change the host for Redis to ``redis``
2. Run ``docker-compose up -d``

### Example application.yml
```yaml
environment: 'development'
databaseUrl: 'mongodb://localhost:27017/database'
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
* Rodentman87#8787 (Frontend Developer) ([GitHub](https://github.com/Rodentman87))
* August#5820 (Project Lead) ([GitHub](https://github.com/auguwu))
* Ice#4710 (DevOps, Developer) ([GitHub](https://github.com/IceeMC))

### Hackweek Participants
* Chris ([GitHub](https://github.com/auguwu))
* dondish ([GitHub](https://github.com/dondish))
* Kyle ([GitHub](https://github.com/scrap))
* Wessel ([GitHub](https://github.com/Wessel))
* David ([GitHub](https://github.com/davidjcralph))
