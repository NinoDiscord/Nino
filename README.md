# Nino
> :hammer: **Advanced and cute moderation discord bot as an entry of Discord's Hack Week!**

## Checklist
- Commands
  - [] Moderation
    - [x] ban
    - [x] kick
    - [] mute
    - [] warn
    - [] pardon
    - [] warnings
    - [x] case
    - [] unmute
    - [] unban
    - [] reason
    - [x] softban
    - [x] timeouts
  - [x] Core :tada:
    - [x] help
    - [x] invite
    - [x] locale
    - [x] ping
    - [x] shardinfo
    - [x] source
    - [x] statistics
    - [x] uptime
  - [x] Owner :tada:
    - [x] blacklist
    - [x] whitelist
    - [x] eval
  - [x] Settings :tada:
    - [x] punishments
    - [x] mutedrole
    - [x] mod-log
    - [x] automod
    - [x] logging
    - [x] prefix

- Core :tada:
  - [x] Commands
  - [x] Listeners
  - [x] Punishments
  - [x] Localization
  - [x] Database
  - [x] Redis
  - [x] Sentry

- Automod :tada:
  - [x] Short Links
  - [x] Dehoisting
  - [x] Blacklist
  - [x] Mentions
  - [x] Invites
  - [x] Spam

- Logging :tada:
  - [x] Message Bulk Delete
  - [x] Message Delete
  - [x] Message Update
  - [x] Voice Joined
  - [x] Voice Switch
  - [x] Voice Left
  - [x] User Banned
  - [x] User Unbanned

- [x] Timeouts Microservice :tada:
- [] API

## Features
- Auto Moderation: **Prevents raids, spam, ads, and much more!**
- Advanced warning system and automated punishments: **Automically punish who commit offenses!**
- Simplicity: **Simplicity is key to any discord bot, and Nino makes sure of it! All commands are tailored to be simple yet powerful.**

...and much more!

## Support
Need support related to Nino or any microservices under the organization? Join in the **Noelware** Discord server in #support under the **Nino** category:

[![discord embed owo](https://discord.com/api/v8/guilds/824066105102303232/widget.png?style=banner3)](https://discord.gg/ATmjFH9kMH)

## Contributing
View our [contributing guidelines](https://github.com/NinoDiscord/Nino/blob/master/CONTRIBUTING.md) and [code of conduct](https://github.com/NinoDiscord/Nino/blob/master/CODE_OF_CONDUCT.md) before contributing.

## Self-hosting
Before attempting to self-host Nino, we didn't plan for users to be able to self-host their own instance of Nino. Most builds are usually buggy and untested as of late, we do have a "stable" branch but it can be buggy sometimes! If you want to use cutting edge features that are most likely not finished, view the [edge](https://github.com/NinoDiscord/Nino/tree/edge) branch for more details. The "stable" branch is master, so anything that should be stable will be added to the upstream.

We will not provide support on how to self-host Nino, use at your own risk! If you do not want to bother hosting it, you can always invite the [public instance](https://discord.com/oauth2/authorize?client_id=531613242473054229&scope=bot) which will be the same experience if you hosted it or not.

### Prerequisites
Before running your own instance of Nino, you will need the following tools:

- [Timeouts Service](https://github.com/NinoDiscord/timeouts) (Used for mutes and such or it'll not work!)
- [Node.js](https://nodejs.org) (Latest is always used in development, but LTS is recommended)
- [PostgreSQL](https://postgresql.org) (12 is used in development but anything above 10 should fairly work!)
- [Redis](https://redis.io) (6.2 is used in development but above v5 should work)

If you're moving from v0 to v1, you will need your MongoDB instance before to port the database!

There is tools that are optional but are mostly recommended in some cases:

- [Sentry](https://sentry.io) - Useful to find out where errors are in a pretty UI
- [Docker](https://docker.com) - If you're a masochist and want to run a private instance with Docker
- [Git](https://git-scm.com) - Useful for fetching new updates easily.

### Setting up
There are 2 ways to setup Nino: using Docker or just doing shit yourself. Doing it yourself can very tedious
of how much Nino uses from v0 to v1 since Nino utilizes microservices! **☆♬○♩●♪✧♩((ヽ( ᐛ )ﾉ))♩✧♪●♩○♬☆**

### Docker
This step isn't finished due to the rewrite not being stable.

### Normal
This step isn't finished due to the rewrite not being stable.

## Example `config.yml` file
- Replace `<discord token>` with your Discord bot's token
- Replace `<username>` with your PostgreSQL database username
- Replace `<password>` with your PostgreSQL database password
- Replace `<host>` (under `database`) with your PostgreSQL database host, if running locally, just use `localhost` or `database` if on Docker
- Replace `<port>` with your PostgreSQL database port it's running, if running locally, set it to `5432`
- Replace `<host>` (under `redis`) with your Redis connection host, if running locally, just use `localhost` or `redis` if on Docker
- Replace `<auth>` with the authenication token you set in the [timeouts](https://github.com/NinoDiscord/timeouts) relay service.

```yml
environment: development
token: <discord token>

prefixes:
  - !

database:
  url: postgres://<username>:<password>@<host>:<port>/<database>

redis:
  host: <host>
  port: 6379

timeouts:
  port: 4025
  auth: <auth>
```

## Maintainers
* Ice#4710 (DevOps, Developer) ([GitHub](https://github.com/IceeMC))
* Rodentman87#8787 (Frontend Developer) ([GitHub](https://github.com/Rodentman87))
* August#5820 (Project Lead, Developer) ([GitHub](https://github.com/auguwu))

## Hackweek Participants
* Chris ([GitHub](https://github.com/auguwu))
* dondish ([GitHub](https://github.com/dondish))
* Kyle ([GitHub](https://github.com/scrap))
* Wessel ([GitHub](https://github.com/Wessel))
* David ([GitHub](https://github.com/davidjcralph))
