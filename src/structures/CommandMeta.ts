import 'reflect-metadata';
import CommandContext from './Context';
import { User, TextChannel, Member, Role, Channel, TextableChannel } from 'eris';

const argumentKey = Symbol('arguments');

export interface CommandArgument {
  type: User | Member | TextableChannel | Role | Number | string;
  name?: string;
  optional: boolean;
  equals?: string;
  index?: number;
}

const argument = (cmdarg: CommandArgument): ParameterDecorator => {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    const args: CommandArgument[] = Reflect.getOwnMetadata(argumentKey, target, propertyKey) || [];
    if (cmdarg.name == undefined && cmdarg.index == undefined) throw new Error('Arguments must have a name or an index');
    args.push(cmdarg);
    Reflect.defineMetadata(argumentKey, args, target, propertyKey);
  };
};

const injectArguments = (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) => {
  let method = descriptor.value;
  descriptor.value = function () {
    let args: CommandArgument[] = Reflect.getOwnMetadata(argumentKey, target, propertyName);
    let ctx: CommandContext = arguments[0];
    
    if (args) {
      for (let arg of args) {

        if (!arg.optional) {
          let argumentMissing = arg.index && !ctx.args.has(arg.index);
          let argumentExists = arg.index && ctx.args.has(arg.index);
          let flagMissing = arg.name && !ctx.flags.get(arg.name);
          let flagExists = arg.name && !!ctx.flags.get(arg.name);
          if (argumentMissing && !flagExists) {
            throw new Error(`Missing required argument: at index ${arg.index!}`);
          }
          if (flagMissing && !argumentExists) {
            throw new Error(`Missing required flag: --${arg.name!}`);
          }
        }
        
      }
    }

    return method?.apply(this, args);
  };
};