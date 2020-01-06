import { mockDeep, mock } from 'jest-mock-extended';
import { TextChannel } from 'eris';
import CommandContext from '../../structures/Context';
import container from '../../inversify.config';
import { TYPES } from '../../types';
import Bot from '../../structures/Bot';

describe('Invite command', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const cmd = bot.manager.getCommand('invite')!;

  beforeEach(() =>
    jest.clearAllMocks()
  );

  it('it should return a message to invite the bot', async() => {
    ctx.message.channel = mock<TextChannel>();
    ctx.me.id = '420691111';
    await cmd.run(ctx);
    expect(ctx.send.mock.calls.length).toBe(1);
    const call = ctx.send.mock.calls[0];
    expect(call[0]).toBe(':link: Here you go: <https://discordapp.com/oauth2/authorize?client_id=420691111&scope=bot>');
  });
});