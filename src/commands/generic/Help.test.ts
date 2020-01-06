import HelpCommand from './Help';
import { mockDeep, mock } from 'jest-mock-extended';
import CommandContext from '../../structures/Context';
import container from '../../inversify.config';
import Bot from '../../structures/Bot';
import { TYPES } from '../../types';
import GuildSettings from '../../structures/settings/GuildSettings';
import { TextChannel } from 'eris';
import { GuildModel } from '../../models/GuildSchema';
import EmbedBuilder from '../../structures/EmbedBuilder';


describe('Help Command', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const help = bot.manager.getCommand('help')!;

  beforeEach(()=>{
    jest.clearAllMocks();
  });

  it('it should return the default response', async () => {
    ctx.message.channel = mock<TextChannel>(); // makes it guild related.
    ctx.getSettings.mockResolvedValue({ prefix: 'x!' } as GuildModel);
    ctx.args.has.mockReturnValueOnce(false);
    ctx.bot.getEmbed.mockReturnValueOnce(new EmbedBuilder());
    ctx.bot.client.user.username='nino';
    ctx.bot.client.user.discriminator='1234';
    await help.run(ctx);
    expect(ctx.embed.mock.calls.length).toBe(1);
    const call = ctx.embed.mock.calls[0];
    expect(call[0].title).toBe('nino#1234 | Commands List');
    expect(call[0].description).toBe('More information is available on the [website](https://nino.augu.dev)!\nThere are currently **undefined** commands available!');
    expect(call[0].fields).toHaveLength(2);
    expect(call[0].footer).toBeDefined();
    expect(call[0].footer!.text).toBe('Use \"x!help <command name>\" to get documentation on a specific command');
  });
});