import { mockDeep } from 'jest-mock-extended';
import CommandContext from '../../structures/Context';
import { TYPES } from '../../types';
import Bot from '../../structures/Bot';
import container from '../../inversify.config';
import SettingsCommand from './Settings';
import { Message, TextChannel } from 'eris';
import { Query } from 'mongoose';

describe('Settings Command', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const cmd = bot.manager.getCommand('settings')! as SettingsCommand;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('it should forward to set', async () => {
    ctx.args.get.mockReturnValueOnce('set');
    cmd.set = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.set).toHaveBeenCalled();
    }
  });
  it('it should forward to reset', async () => {
    ctx.args.get.mockReturnValueOnce('reset');
    cmd.reset = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.reset).toHaveBeenCalled();
    }
  });

  it('it should forward to view', async () => {
    ctx.args.get.mockReturnValueOnce('view');
    cmd.view = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.view).toHaveBeenCalled();
    }
  });

  it('it should forward to add', async () => {
    ctx.args.get.mockReturnValueOnce('add');
    cmd.add = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.add).toHaveBeenCalled();
    }
  });

  it('it should forward to remove', async () => {
    ctx.args.get.mockReturnValueOnce('remove');
    cmd.remove = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.remove).toHaveBeenCalled();
    }
  });

  it('it should forward to disable', async () => {
    ctx.args.get.mockReturnValueOnce('disable');
    cmd.disable = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.disable).toHaveBeenCalled();
    }
  });

  it('it should forward to enable', async () => {
    ctx.args.get.mockReturnValueOnce('enable');
    cmd.enable = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.enable).toHaveBeenCalled();
    }
  });

  it('it should default to view', async () => {
    ctx.args.get.mockReturnValueOnce('');
    cmd.view = jest.fn((_: CommandContext)=>Promise.resolve({} as Message));
    try {
      await cmd.run(ctx);
    } 
    finally {
      expect(cmd.view).toHaveBeenCalled();
    }
  });
    
});

describe('Settings Command - Set', () => {
  const ctx = mockDeep<CommandContext>();
  const bot = container.get<Bot>(TYPES.Bot);
  const cmd = bot.manager.getCommand('settings')! as SettingsCommand;

  beforeEach(() =>
    jest.clearAllMocks()
  );

  it('it should set the settings', async () => {
    ctx.message.channel = mockDeep<TextChannel>();
    ctx.message.channel.guild.id = '1';
    ctx.args.get
      .mockReturnValueOnce('modlog')
      .mockReturnValueOnce('3');
    ctx.bot.client.getRESTChannel.mockResolvedValueOnce({ id: '3', type: 0, mention: '<#3>' } as TextChannel);
    ctx.bot.settings.update.mockImplementationOnce((id: string, doc: {[x: string]: any}, cb: (error: any, raw: any)=>void)=>{
      cb(null, null);
      return {} as Query<any>;
    });
    await cmd.set(ctx);
    expect(ctx.bot.settings.update).toHaveBeenCalled();
    expect(ctx.bot.settings.update.mock.calls[0][1]).toMatchObject({
      $set: {
        modlog: '3'
      }
    });
    expect(ctx.send).toHaveBeenCalled();
    expect(ctx.send.mock.calls[0][0]).toBe('Updated the mod log channel to **<#3>**');
  });

});
