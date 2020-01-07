import { mockDeep, mock } from 'jest-mock-extended';
import { TextChannel } from 'eris';
import { GuildModel } from '../../models/GuildSchema';
import CommandContext from '../../structures/Context';
import EmbedBuilder from '../../structures/EmbedBuilder';
import container from '../../inversify.config';
import { TYPES } from '../../types';
import Bot from '../../structures/Bot';

describe('Help Command', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const help = bot.manager.getCommand('help')!;

  beforeEach(() => {
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

  it('it should return the help of the command', async () => {
    ctx.message.channel = mock<TextChannel>(); // makes it guild related.
    ctx.args.has.mockReturnValueOnce(true);
    ctx.args.get.mockReturnValueOnce('ping');
    const ping = bot.manager.getCommand('ping')!;
    ctx.bot.manager.getCommand.mockReturnValueOnce(ping);
    await help.run(ctx);
    expect(ctx.embed.mock.calls.length).toBe(1);
    const call = ctx.embed.mock.calls[0][0];
    expect(call).toBeDefined();
    expect(call).toMatchObject(ping.help());
  });

  it('it should not find the command', async () => {
    ctx.message.channel = mock<TextChannel>(); // makes it guild related.
    ctx.args.has.mockReturnValueOnce(true);
    ctx.args.get.mockReturnValueOnce('pong');
    ctx.bot.manager.getCommand.mockReturnValueOnce(undefined);
    await help.run(ctx);
    expect(ctx.send.mock.calls.length).toBe(1);
    const call = ctx.send.mock.calls[0][0];
    expect(call).toBeDefined();
    expect(call).toBe('Sorry, I was not able to find the command `pong`');
  });

});
