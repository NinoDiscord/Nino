# Nino
> :hammer: **Advanced and cute moderation discord bot as an entry of Discord's Hack Week!**
>
> [Website](https://nino.floofy.dev) **|** [Support](https://discord.gg/JjHGR6vhcG) **|** [Invite Me!](https://discord.com/oauth2/authorize?client_id=531613242473054229&scope=bot)

## Checklist
- Commands
  - [] Moderation
  - [x] Core
  - [x] Owner
  - [] Settings

- Core
  - [x] Commands
  - [x] Listeners
  - [x] Punishments
  - [x] Localization
  - [x] Database
  - [x] Redis
  - [x] Sentry

- Automod
  - [] Dehoisting
  - [] Blacklist
  - [] Mentions
  - [] Invites
  - [] Raid
  - [] Spam

- Logging
  - [] Message Delete
  - [] Message Update
  - [x] Voice Joined
  - [x] Voice Switch
  - [x] Voice Left
  - [x] User Banned
  - [x] User Unbanned

- [] Frontend
- [] Timeouts
- [] API

## Features
- Auto Moderation: **Prevents raids, spam, ads, and much more!**
- Advanced warning system and automated punishments: **Automically punish who commit offenses!**
- and much more!

## Contributing
View our [contributing guidelines](https://github.com/NinoDiscord/Nino/blob/master/CONTRIBUTING.md) and [code of conduct](https://github.com/NinoDiscord/Nino/blob/master/CODE_OF_CONDUCT.md).

## Self-hosting
Before attempting to self-host Nino, we didn't plan for users to be able to self-host their own instance of Nino. Most builds are usually buggy and untested as of late, we do have a "stable" branch but it can be buggy sometimes! If you want to use cutting edge features that are most likely not finished, view the [next](https://github.com/NinoDiscord/Nino/tree/next) branch for more details. The "stable" branch is master, so anything that should be stable will be added to the upstream.

We will not provide support on how to self-host Nino, use at your own risk! If you do not want to bother hosting it, you can always invite the [public instance](https://discord.com/oauth2/authorize?client_id=531613242473054229&scope=bot) which will be the same experience if you hosted it or not.

### Prerequisites
Before running your own instance of Nino, you will need the following tools:

- [Node.js](https://nodejs.org) (Latest is always used in development, but LTS is recommended)
- [PostgreSQL](https://postgresql.org) (12 is used in development but anything above 10 should fairly work!)
- [Redis](https://redis.io)

If you're moving from v0 to v1, you will need your MongoDB instance before to port the database!

There is tools that are optional but are recommended in most cases!

- [Sentry](https://sentry.io)
- [Docker](https://docker.com)
- [Git](https://git-scm.com)

### Setting up
There are 2 ways to setup Nino, the normal way and the Docker way. The Docker way is generally used with the public instances of Nino but not recommended for smaller instances, so that's why the normal way exists!

### Docker
This step isn't finished due to the rewrite not being stable.

### Normal
This step isn't finished due to the rewrite not being stable.

## Example `config.yml` file
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
```

## Maintainers
* Rodentman87#8787 (Frontend Developer) ([GitHub](https://github.com/Rodentman87))
* August#5820 (Project Lead) ([GitHub](https://github.com/auguwu))
* Ice#4710 (DevOps, Developer) ([GitHub](https://github.com/IceeMC))

## Hackweek Participants
* Chris ([GitHub](https://github.com/auguwu))
* dondish ([GitHub](https://github.com/dondish))
* Kyle ([GitHub](https://github.com/scrap))
* Wessel ([GitHub](https://github.com/Wessel))
* David ([GitHub](https://github.com/davidjcralph))
