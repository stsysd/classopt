import * as errors from "./errors.ts";
import { Constructor } from "./utils.ts";
import { setHelp, getName, pushOpt } from "./meta.ts";
import { parse } from "./parse.ts";
import { help } from "./help.ts";
import { red } from "../deps.ts";

function handleParseError(e: unknown): void {
  if (e instanceof errors.ParseError) {
    console.error(red(`error: ${e.message}`));
    console.error();
    console.error(help(e.target));
  } else {
    throw e;
  }
}

export abstract class Command<Context = void> {
  abstract execute(ctxt: Context): Promise<void>;

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
      handleParseError(e);
    }
    return cmd;
  }
}

const HELP_FLAG = Symbol("help-flag");
export function Help(
  about: string
): <T extends Command<unknown>>(target: Constructor<T>) => void {
  return <T extends Command<unknown>>(target: Constructor<T>) => {
    setHelp(target, about);
    pushOpt(target.prototype, {
      about: "Prints help information",
      type: "boolean",
      prop: HELP_FLAG,
      long: "--help",
      short: "-h",
      multiple: false,
      $stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (this: T, ...args: unknown[]) {
      if (Reflect.has(this, HELP_FLAG)) {
        console.log(this.help());
        return;
      }
      return execute.call(this, ...args);
    };
  };
}

const VERSION_FLAG = Symbol("version-flag");
export function Version(
  ver: string
): <T extends Command<unknown>>(target: Constructor<T>) => void {
  return <T extends Command<unknown>>(target: Constructor<T>) => {
    pushOpt(target.prototype, {
      about: "Prints version information",
      type: "boolean",
      prop: VERSION_FLAG,
      long: "--version",
      short: "-V",
      multiple: false,
      $stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (this: T, ...args: unknown[]) {
      if (Reflect.has(this, VERSION_FLAG)) {
        const name = getName(target);
        console.log(`${name} ${ver}`);
        return;
      }
      return execute.call(this, ...args);
    };
  };
}
