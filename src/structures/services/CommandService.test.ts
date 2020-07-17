import container from '../../inversify.config';
import Bot, { Config } from '../Bot';
import { TYPES } from '../../types';
import { Message, TextableChannel, User } from 'eris';
import CommandContext from '../Context';
import Language from '../Language';

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
      host: 'localhost',
      port: 6379,
      db: undefined,
    },
    sentryDSN: undefined,
    botlists: undefined,
    webhook: undefined,
    ksoft: undefined
  });
  const bot = container.get<Bot>(TYPES.Bot);
  const commandService = bot.manager.service;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('it should create a command invocation', () => {
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
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
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
    expect(context).toBeDefined();
    expect(context.args).toBeDefined();
    expect(context.args.args).toEqual(expect.arrayContaining(args));
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeUndefined();
  });

  it('it should be able to invoke the command', () => {
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toBeUndefined();
  });

  it('it should not be able to invoke the command because it\'s disabled', () => {
    bot.manager.getCommand('help')!.disabled = true;
    const message = { content: '!help hi' } as Message;
    const args = ['help', 'hi'];
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toBeDefined();
    expect(invocation!.canInvoke()!.key).toEqual('errors.disabled');
    expect(invocation!.canInvoke()!.args).toEqual({ command: 'help' });
  });

  it('it should not be able to invoke the command because the command is guild only', () => {
    const message = {
      content: '!settings',
      channel: { type: 1 } as TextableChannel,
    } as Message;
    const args = ['settings'];
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toBeDefined();
    expect(invocation!.canInvoke()!.key).toEqual('errors.guildOnly');
    expect(invocation!.canInvoke()!.args).toEqual({ command: 'settings' });
  });

  it('it should not be able to invoke the command because the command is owner only', () => {
    const message = {
      content: '!eval',
      author: { id: '1' } as User,
    } as Message;
    const args = ['eval'];
    const context = new CommandContext(bot, message, args, bot.locales.get('en_US'), undefined);
    const invocation = commandService.getCommandInvocation(context);
    expect(invocation).toBeDefined();
    expect(invocation!.canInvoke()).toBeDefined();
    expect(invocation!.canInvoke()!.key).toEqual('errors.ownerOnly');
    expect(invocation!.canInvoke()!.args).toEqual({ command: 'eval' });
  });
});
