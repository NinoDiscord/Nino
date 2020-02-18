import container from '../../inversify.config';
import Bot, { Config } from '../Bot';
import { TYPES } from '../../types';
import { Message, TextableChannel, User } from 'eris';
import CommandContext from '../Context';

describe('CommandService', () => {
  container.rebind<Config>(TYPES.Config).toConstantValue({
    status: undefined,
    statusType: undefined,
    environment: 'development',
    databaseUrl: 'mongodb://localhost:27017/nino',
    disabledCommands: [],
    disabledCategories: undefined,
    owners: undefined,
    prometheus: 5595,
    discord: {
      token: '',
      prefix: 'x!',
    },
    redis: {
      password: undefined,
      host: 'localhost',
      port: 6379,
      database: undefined,
    },
    sentryDSN: undefined,
    botlists: undefined,
  });
  const bot = container.get<Bot>(TYPES.Bot);
  const commandService = bot.manager.service;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('it should create a command invocation', () => {
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args);
    expect(context).toBeDefined();
    expect(context.args).toBeDefined();
    expect(context.args.args).toEqual(expect.arrayContaining(args));
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.command.name).toBe('help');
  }, 5);

  it('it should not create a command invocation', () => {
    const message = { content: '' } as Message;
    const args = [];
    const context = new CommandContext(bot, message, args);
    expect(context).toBeDefined();
    expect(context.args).toBeDefined();
    expect(context.args.args).toEqual(expect.arrayContaining(args));
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeUndefined();
  });

  it('it should be able to invoke the command', () => {
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toBeUndefined();
  });

  it('it should not be able to invoke the command because it\'s disabled', () => {
    bot.manager.getCommand('help')!.disabled = true;
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toEqual('Currently, command `help` is globally disabled');
  });

  it('it should not be able to invoke the command because the command is guild only', () => {
    const message = {
      content: '!settings',
      channel: { type: 1 } as TextableChannel,
    } as Message;
    const args = ['settings'];
    const context = new CommandContext(bot, message, args);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toEqual(
      'Sorry, but you need to be in a guild to execute the `settings` command.'
    );
  });

  it('it should not be able to invoke the command because the command is owner only', () => {
    const message = {
      content: '!eval',
      author: { id: '1' } as User,
    } as Message;
    const args = ['eval'];
    const context = new CommandContext(bot, message, args);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toEqual(
      'Sorry, but you need to be a developer to execute the `eval` command.'
    );
  });
});
