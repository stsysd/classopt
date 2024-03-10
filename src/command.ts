import * as errors from "./errors.ts";
import { ClassDecorator, Constructor } from "./types.ts";
import { defineAbout, getName, help, parse, pushOpt } from "./parse.ts";
import { red } from "../deps.ts";

function handleParseError(e: unknown): void {
  if (e instanceof errors.ParseError) {
    console.error(red(`parse error: ${e.message}`));
    console.error();
    console.error(help(e.target as Constructor));
    Deno.exit(1);
  } else if (e instanceof errors.DefinitionError) {
    console.error(red(`definition error: ${e.message}`));
    Deno.exit(1);
  } else {
    throw e;
  }
}

export abstract class Command<Context = void> {
  abstract execute(ctx: Context): Promise<void> | void;

  help(): string {
    return help(this);
  }

  static async run<
    T extends Command<void>,
    Self extends Constructor<T>,
  >(
    this: Self,
    args: string[],
  ): Promise<void> {
    try {
      await parse(this, args).execute();
    } catch (e) {
      handleParseError(e);
    }
  }
}

const versionFlagSymbol = Symbol("classopt-version-flag");

export function Version<
  Context,
  T extends Command<Context>,
  C extends Constructor<T>,
>(ver: string): ClassDecorator<T, C> {
  return (
    target: C,
    ctx: ClassDecoratorContext,
  ) => {
    pushOpt(ctx.metadata, {
      type: "boolean",
      about: "Prints version information",
      prop: versionFlagSymbol,
      long: "--version",
      short: "-V",
      multiple: false,
      stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (ctx: Context) {
      const name = getName(this.constructor);
      if (Reflect.get(this, versionFlagSymbol) === true) {
        console.log(`${name} ${ver}`);
        return;
      }
      return execute.call(this, ctx);
    };
  };
}

const helpFlagSymbol = Symbol("classopt-name-flag");
export function Help<
  Context,
  T extends Command<Context>,
  C extends Constructor<T>,
>(
  about?: string,
): ClassDecorator<T, C> {
  return (target: C, ctx: ClassDecoratorContext) => {
    if (about) {
      defineAbout(ctx, about);
    }
    pushOpt(ctx.metadata, {
      type: "boolean",
      about: "Prints help information",
      prop: helpFlagSymbol,
      long: "--help",
      short: "-h",
      multiple: false,
      stopEarly: true,
    });
    const execute = target.prototype.execute;
    target.prototype.execute = function (ctx: Context) {
      if (Reflect.get(this, helpFlagSymbol) === true) {
        console.log(help(this));
        return;
      }
      return execute.call(this, ctx);
    };
  };
}
