// import CommandService from './CommandService';
// import { Message, User, Member, Channel, TextableChannel, MessageContent, Client, Guild, GuildChannel, TextChannel } from 'eris';
// import NinoClient, { NinoConfig } from '../Client';

// function dummyConfig(): NinoConfig {
//     return {
//         environment: '',
//         databaseUrl: '',
//         discord: {
//             prefix: '',
//             token: '',
//         },
//         redis: {
//             host: '',
//             port: 0,
//         },
//         webhook: {
//             id: '',
//             token: '',
//         },
//         webserver: 0,
//         mode: '',
//         sentryDSN: '',
//         botlists: {
//             topggtoken: '',
//             bfdtoken: '',
//             dboatstoken: '',
//             blstoken: '',
//         }
//     };
// }

// function dummyGuild(client: Client): Guild {
//     return new Guild({
//         id: '0',
//         joined_at: Date.now(),
//         member_count: 1
//     }, client);
// }

// function dummyClient(): NinoClient {
//     let c = new NinoClient(dummyConfig());
//     let g = dummyGuild(c);
//     g.channels.add(dummyChannel(1, g) as TextChannel);
//     c.guilds.add(g);

//     return c;
// }

// function dummyChannel(type: number, guild: Guild): GuildChannel {
//     return new GuildChannel({
//         id: '1',
//         type
//     }, guild);
// }

// describe('CommandService', () => {
//     let client: NinoClient;
//     let cmdservice: CommandService;


//     beforeAll(() => {
//         client = dummyClient();
//         cmdservice = new CommandService(client);
//     });

//     it('it should return invocation of the correct command', () => {
//         const message = dummyMessage('!ban hello', )
//     })
// });

describe('CommandService', () => {
    it('WIP', () => {
        
    });
});