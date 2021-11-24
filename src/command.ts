import * as errors from "./errors.ts";
import { Constructor } from "./utils.ts";
import { setHelp, getName, pushOpt } from "./meta.ts";
import { parse } from "./parse.ts";
import { help } from "./help.ts";

function handleParseError(e: unknown, cmd: Command): void {
  if (e instanceof errors.ParseError) {
    console.error(`error: ${e.message}`);
    console.log(cmd.help());
  } else {
    throw e;
  }
}

export abstract class Command {
  abstract execute(): Promise<void>;

  help(): string {
    return help(this);
  }

  parse<T extends Command>(this: T, args: string[]): T {
    return parse(this, args);
  }

  static async run<T extends Command, Self extends Constructor<T>>(
    this: Self,
    args: string[]
  ): Promise<T> {
    const cmd = new this();
    try {
      await cmd.parse(args).execute();
    } catch (e) {
      handleParseError(e, cmd);
    }
    return cmd;
  }
}

const HELP_FLAG = Symbol("help-flag");
export function Help(
  about: string
): <T extends Command>(target: Constructor<T>) => void {
  return <T extends Command>(target: Constructor<T>) => {
    setHelp(target, about);
    pushOpt(target.prototype, {
      about: "Prints help information",
      prop: HELP_FLAG,
      long: "--help",
      short: "-h",
      type: "boolean",
      $stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (this: T) {
      if (Reflect.has(this, HELP_FLAG)) {
        console.log(this.help());
        return;
      }
      return execute.call(this);
    };
  };
}

const VERSION_FLAG = Symbol("version-flag");
export function Version(
  ver: string
): <T extends Command>(target: Constructor<T>) => void {
  return <T extends Command>(target: Constructor<T>) => {
    pushOpt(target.prototype, {
      about: "Prints version information",
      prop: VERSION_FLAG,
      long: "--version",
      short: "-V",
      type: "boolean",
      $stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (this: T) {
      if (Reflect.has(this, VERSION_FLAG)) {
        const name = getName(target);
        console.log(`${name} ${ver}`);
        return;
      }
      return execute.call(this);
    };
  };
}
