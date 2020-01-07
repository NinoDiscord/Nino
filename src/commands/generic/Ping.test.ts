import { mockDeep, mock } from 'jest-mock-extended';
import { TextChannel, Message } from 'eris';
import CommandContext from '../../structures/Context';
import container from '../../inversify.config';
import { TYPES } from '../../types';
import Bot from '../../structures/Bot';

describe('Ping command', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const cmd = bot.manager.getCommand('ping')!;

  beforeEach(() =>
    jest.clearAllMocks()
  );

  it('it should return a message that shows the current ping', async() => {
    const msg = mock<Message>();
    ctx.send.mockResolvedValueOnce(msg);
    Date.now = jest.fn(() => 1578393270160);
    await cmd.run(ctx);
    expect(ctx.send.mock.calls.length).toBe(2);
    expect(msg.delete.mock.calls).toHaveLength(1);
    const firstcall = ctx.send.mock.calls[0];
    expect(firstcall[0]).toBe(':ping_pong: S-seems weird why you w-want it!');
    const secondcall = ctx.send.mock.calls[1];
    expect(secondcall[0]).toBe(':ping_pong: Pong! `0ms`');  
  });
});
