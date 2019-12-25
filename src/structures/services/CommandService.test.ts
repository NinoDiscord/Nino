import container from '../../inversify.config';
import Bot from '../Bot';
import { TYPES } from '../../types';
import { Client, Message } from 'eris';
import { mocked } from 'ts-jest';
import CommandService from './CommandService';
import ArgumentParser from '../parsers/ArgumentParser';
import CommandContext from '../Context';
import NinoCommand, { CommandInfo } from '../Command';

describe('CommandService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('it should create a command invocation', async () => {
        const NBot = mocked(Bot, true);
        container.rebind<Bot>(TYPES.Bot).to(NBot).inSingletonScope();
        const bot = container.get<Bot>(TYPES.Bot);
        bot.manager.getCommand.prototype.mockReturnValueOnce((new NinoCommand(bot as unknown as Bot, {name: 'help'} as CommandInfo)));
        const commandService = bot.manager.service;
        const message = mocked<Message>({content: "!help hi"} as Message, true);
        const args = ["help", "hi"];
        const context: CommandContext = mocked(new CommandContext(bot as unknown as Bot, message as unknown as Message, args));      
        expect(context).toBeDefined();
        expect(context.args).toBeDefined();
        expect(context.args.args).toEqual(expect.arrayContaining(args));
        const invocation = commandService.getCommandInvocation(context);
        expect(invocation).toBeDefined();
        expect(invocation!.command.name).toBe('help');
    }, 5);
});