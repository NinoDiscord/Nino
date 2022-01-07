# bot submodule
This is a collection of modules that keeps the Discord bot running together.

## Modules
- [api](./api) - The API that is used for the dashboard and the slash commands implementation.
- [automod](./automod) - Collection of automod that Nino executes.
- [commands](./commands) - Text-based commands implementation.
- [core](./core) - Core components + modules.
- [database](./database) - Database models and utilities.
- [markup](./markup) - Soon:tm: markup language for customizing modlogs and logging outputs.
- [metrics](./metrics) - Prometheus metric registry.
- [punishments](./punishments) - Core punishments module to punish users based off an action.
- [slash-commands](./slash-commands) - Slash commands implementation.
- [src](./src) - The main application that you run with `java -jar` or with Docker!
- [timeouts](./timeouts) - Kotlin client for Nino's [timeouts microservice](https://github.com/NinoDiscord/timeouts)
