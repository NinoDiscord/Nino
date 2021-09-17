# [Nino](https://nino.sh) • <img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/NinoDiscord/Nino/ESLint%20Workflow/master?style=flat-square" /> <img alt="GitHub License" src="https://img.shields.io/github/license/NinoDiscord/Nino?style=flat-square" /> <img alt="Noelware Server" src="https://discord.com/api/v9/guilds/824066105102303232/widget.png?style=shield" />

> :hammer: **Cute, advanced discord moderation bot made in Eris. Make your server cute and automated with utilities for you and your server moderators! ☆ ～('▽^人)**

## Features
- 🔨 **Auto Moderation** - Prevent raids, spam, ads, and much more!
  - Target users who post invites to your server, spam in a certain interval, and much more!
  - Thresholds, messages, prevent roles/members from automod is all customizable!

- ⚙️ **Advanced Configuration** - Configure Nino to feel like Nino is a part of your server~
  - Anything to Nino (mod-log messages, automod threshold/messages/prevention, logging) is all customizable!

- ✨ **Simplicity** - Simplicity is key to any discord bot, and Nino is sure of it!
  - Commands are tailored to be powerful but simple to the end user.
  - Fetch help on a command using `x!help <command>`, `x!<command> --help/-h`, or `x!<command> help`.
  - Stuck on what command usage is like? You can run `x!help usage` on how arguments are executed.

...and much more!

## Support
Need any help with Nino or any microservices under the **@NinoDiscord** organization? You can join the **Noelware** Discord server
under [**#support**](https://discord.com/channels/824066105102303232/824071651486335036):

![Noelware Discord Server](https://invidget.switchblade.xyz/ATmjFH9kMH)

## Contributing
Before you get started to contribute to Nino, view our [contributing guidelines](https://github.com/NinoDiscord/Nino/blob/master/.github/CONTRIBUTING.md) and our [code of conduct](https://github.com/NinoDiscord/Nino/blob/master/.github/CODE_OF_CONDUCT.md) before contributing.

## Self-hosting
Before to self-host Nino, ***we will not give you support on how to run your own Nino!*** The source code is available for
education purposes, and is not meant to run on small instances. Also, we have not planned for people to self-host their own
instance of Nino, since the source code and the main bots ARE identical from the source code. And, most builds pushed
to this repository have NOT been tested in production environments, so bewarn before running! If you do encouter bugs
with the bot or running it, please report it in our [issue tracker](https://github.com/NinoDiscord/Nino/issues) with the **bug**
label!

### Prerequisites
Before running your own instance of Nino, you will need the following required tools:

- [Timeouts Microservice](https://github.com/NinoDiscord/timeouts) **~** Used for mutes, bans, and more. This will not make Nino operate successfully.

- [PostgreSQL](https://postgresql.org) **~** Main database for holding user or guild data. Recommended version is 10 or higher.
- [Redis](https://redis.io) **~** Open source in-memory database storage to hold entities for quick retrieval. Recommended version is 5 or higher.

If you're moving from **v0.x** -> **v2.x**, you will need to have your MongoDB instance and our utility for converting documents
into JSON, [Rei](https://github.com/NinoDiscord/Rei) before contiuning.

#### Extra Tooling
There is tools that are *optional* but are mostly not-recommended in most cases:

- [cluster-operator](https://github.com/MikaBot/cluster-operator) **~** Easily manages discord clustering between multiple nodes
- [Docker](https://docker.com) **~** Containerisation tool for isolation between the host and the underlying container.
- [Sentry](https://sentry.io) **~** Open-source application monitoring, with a focus on error reporting.
- [Uni](https://github.com/Noelware/Uni) **~** Sidecar container to post metrics to [instatus.com](https://instatus.com)

### Setup
You're almost there on how to run your instance! Before you frantically clone the repository and such, there is two options
on how to use Nino:

- Normally: You can spin up a **PM2** process to run Nino, which will run fine!
- Docker: Uses the [Dockerfile](./Dockerfile) to run Nino in a isolated container seperated from your machine and the host.

#### Docker Setup
> ️️️️️️️⚠️ **BEFORE YOU CLONE, MAKE SURE DOCKER IS INSTALLED!**

1. **Clone the repository** using the `git clone` command:

```sh
$ git clone https://github.com/NinoDiscord/Nino [-b edge] # If you want to use cutting edge feature,
# add the `-b edge` flag!
```

2. **Change the directory** to `Nino` or however you named it, and create a image:

```sh
$ cd Nino
$ docker build -t nino:latest --no-cache .
```

3. **Run the image** to start the bot!

```sh
# A volume is required for `.env` and `config.yml` so it can properly
# load your configuration!
$ docker run -d -v './config.yml:/app/Nino/config.yml:ro' -v './.env:/app/Nino/.env' nino:latest
```

4. **[OPTIONAL]** Use `docker-compose` to start all services.

```sh
# We provide a `docker-compose.yml` file so you can spin up the required
# services Nino requires without setting it up yourself.
$ docker-compose up -d
```

#### Normal Setup
> ✏️ **Make sure you have a service to run Nino like `systemd` or `pm2`. We provide a `systemd` service file to run it on a Linux machine.**

1. **Clone the repository** using the `git clone` command:

```sh
$ git clone https://github.com/NinoDiscord/Nino [-b edge] # If you want to use cutting edge feature,
# add the `-b edge` flag!
```

2. **Install import dependencies**

```sh
$ yarn
```

3. **Build and compile** TypeScript

```sh
$ yarn build # Run `yarn build:no-lint` to only cover type-checking.
```

4. **Runs the project**

```sh
$ cd build/src && node main.js
```

## Migrations
There has many changes towards the database when it comes to Nino, since all major releases have some-what a database revision once a while.

### v0.x -> v2.x
If you used **v0.x** in the past and you want to use the **v2.x** version, you can run the following commands:

```sh
# Convert your MongoDB database into JSON file that the migrator script can read.
$ rei convert ...

# Runs the migrator script
$ node scripts/migrator.js --version 0.x <path to directory>
```

### v1.x -> v2.x
If you wish to migrate from **v1.x** towards **v2.x**, you can run the following commands:

```sh
# Export your PostgreSQL database
# Docs: https://www.postgresql.org/docs/12/app-pgdump.html
$ pg_dump

# Run the migrator script
$ node scripts/migrator.js --version 1.x <path to your dumped database>
```

## Configuration
Nino's configurations are made up in a simple **config.yml** file located in the `root directory` of the project. The following keys
must be replaced:

- **Replace `<discord token>` with your [Discord bot's](https://discord.com/developers/applications) token.**
- **Replace `<redis host>` with your Redis host**
  - **If you are using Docker Compose, replace `<redis host>` with "redis" since Compose will link the host with the container.**
  - **If you're running it locally or the config key is not present, it'll infer as `localhost`**
- **Replace `<redis port>` with your Redis network port**
  - **If you are using Docker Compose, you can omit this config key since Compose will infer it to the redis container.**
  - **If you're running it locally or the config key is not present, it'll infer as `6379`**

```yml
# Runs any pending migrations with Prisma, since Prisma doesn't have a way to run this programmatically,
# this will be ran in a worker outside of the main thread.
#
# Default: true
runPendingMigrations: true

# If this config value is set, it'll run the Prometheus server, which you can collect metrics
# and post them in a Grafana instance or whatever! Generally, this isn't really useful in
# small instances. You can view our metrics dashboards here:
#
# Production: https://stats.floofy.dev/d/e3KPDLknk/nino-prod?orgId=1
# Staging: {unknown}
#
# Default: Not present.
prometheusPort: 22043

# Returns the default locale Nino will use to send messages with. Our locales are managed
# under our GitHub repository for now, but this will change.
#
# Default: "en_US"
defaultLocale: "en_US" or "fr_FR" or "pt_BR"

# Sets the environment for logging and such, `development` will give you debug logs
# in which you can report bugs and `production` will omit debug logs without
# any clutter.
#
# Default: "development"
environment: "development" or "production"

# Sets the DSN url for configuring Sentry, this is not recommended on smaller instances!
#
# Default: Not present.
sentryDsn: ...

# Returns the owners of the bot that can execute system admin commands like
# `eval`, `sh`, etc.
#
# Default: [empty array]
owners:
  - owner1
  - owner2
  - ...

# Yields your token to authenticate with Discord. This is REQUIRED
# and must be a valid token or it will not connect.
token: ...

# Returns the token for `ravy.org` API, you cannot retrieve a key
# this is only for the public instances.
ravy: ...

# Returns the configuration for the botlists microservice.
# This is not recommended for smaller instances since using Nino and adding it
# to a public botlist will be deleted from it.
botlists:
  # Returns the interval (in milliseconds) to run the Node interval to
  # post statistics (guild / shard count) to botlists.
  #
  # Min: 15000 - 15 seconds
  # Max: 86400000 - 1 day
  interval: ...

  # Returns the token for posting to Discord Services - https://discordservices.net
  dservices: ...

  # Returns the token for posting to Discord Boats - https://discord.boats
  dboats: ...

  # Returns the token for posting to Discord Bots - https://discord.bots.gg
  dbots: ...

  # Returns the token for posting to top.gg - https://top.gg
  topgg: ...

  # Returns the token for posting to Delly (Discord Extreme List) - https://del.rip
  delly: ...

  # Returns the token for posting to https://discords.com
  discords: ...

# Configuration for Redis for caching entities for quick retrival.
# Read our Privacy Policy on how we collect minimal data: https://nino.sh/privacy
redis:
  # Returns the password for authenticating to your Redis database.
  password: ...

  # Returns an array of sentinels mapped to "host:port",
  # this isn't required on smaller instances.
  # Read more: https://redis.io/topics/sentinel
  sentinels:
    - host:port
    - host2:port2

  # Returns the master password for authenticating using the Sentinel
  # approach. This is not required on smaller instances.
  # Read more: https://redis.io/topics/sentinel
  master: ...

  # Returns the index for Nino so it doesn't collide with any other
  # Redis databases.
  db: 1-16

  # Returns the redis host for connecting
  host: ...

  # Returns the port for connecting
  port: ...

# Timeouts configuration
timeouts:
  # Returns the port for connecting to the WebSocket server.
  port: 4025

  # Returns the authentication string for authorizing.
  auth: ...
```

## Maintainers
- [**Maisy ~ Rodentman87#8787**](https://likesdinosaurs.com) - Web Developer ([GitHub](https://githubc.om/Rodentman87))
- [**Noel  ~ August#5820**](https://floofy.dev) - Project Lead ([GitHub](https://github.com/auguwu))
- [**Ice   ~ Ice#4710**](https://winterfox.tech) - DevOps ([GitHub](https://github.com/IceeMC))

## Hackweek Participants
> Since Nino was a submission towards [Discord's Hackweek](https://blog.discord.com/discord-community-hack-week-build-and-create-alongside-us-6b2a7b7bba33), this is a list of the participants.

- [**davidjcralph#9721**](https://davidjcralph.com) - ([GitHub](https://github.com/davidjcralph))
- [**August#5820**](https://floofy.dev) - ([GitHub](https://github.com/auguwu))
- [**dondish#8072**](https://odedshapira.me/) - ([GitHub](https://github.com/dondish))
- [**Wessel#0498**](https://wessel.meek.moe) - ([GitHub](https://github.com/Wessel))
- **Kyle** - ([GitHub](https://github.com/scrap))

## License
**Nino** is released under the **MIT License**, read [here](/LICENSE) for more information! 💖
