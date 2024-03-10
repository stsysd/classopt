import * as errors from "./errors.ts";
import { Constructor, Either } from "./types.ts";
import {
  confirmDecoratorMetadata,
  type MetadataAccessor,
  prepareMetadataAccessor,
} from "./meta.ts";
import { buildText, indentation, TextBuilder, textTable } from "./text.ts";
import { Queue } from "./queue.ts";
import { dropWhile } from "../deps.ts";
import { kebabify } from "./string.ts";

const nameMetadataAccessor = prepareMetadataAccessor<string>(
  "classopt-name",
);

export function getName(cnst: Constructor): string {
  const metadata = confirmDecoratorMetadata(cnst);
  return nameMetadataAccessor.get(metadata) ?? kebabify(cnst.name);
}

const aboutMetadataAccessor = prepareMetadataAccessor<string>(
  "classopt-about",
);

function getAbout(cnst: Constructor): string | null {
  const metadata = confirmDecoratorMetadata(cnst);
  return aboutMetadataAccessor.get(metadata) ?? null;
}

const parentCommandSymbol = Symbol("classopt-parent-command");

function setParentCommand(instance: object, parent: object) {
  Object.defineProperty(instance, parentCommandSymbol, {
    value: parent,
    writable: true,
    enumerable: false,
  });
}

function getParentCommand(instance: object): object | null {
  return Reflect.get(instance, parentCommandSymbol) ?? null;
}

export function defineName(ctx: ClassDecoratorContext, name: string) {
  nameMetadataAccessor.set(ctx.metadata, name);
}
export function defineAbout(ctx: ClassDecoratorContext, about: string) {
  aboutMetadataAccessor.set(ctx.metadata, about);
}

export type Decoder<T> = (arg: string) => Either<T>;

type OptDescriptor = {
  about: string;
  prop: string | symbol;
  long?: string;
  short?: string;
  multiple: boolean;
  type: string;
  decoder?: Decoder<unknown>;
  stopEarly?: boolean;
};

type ArgDescriptor = {
  about: string;
  name: string;
  prop: string | symbol;
  kind: "required" | "optional" | "rest";
  type: string;
  decoder: Decoder<unknown>;
  default?: unknown;
};

type CmdDescriptor = {
  prop: string | symbol;
  command: Constructor<object>;
};

const optMetadataAccessor: MetadataAccessor<OptDescriptor[]> =
  prepareMetadataAccessor<OptDescriptor[]>("classopt-opt");

function getOpts(metadata: DecoratorMetadata): OptDescriptor[] {
  return optMetadataAccessor.get(metadata) ?? [];
}

export function pushOpt(metadata: DecoratorMetadata, desc: OptDescriptor) {
  const stored = optMetadataAccessor.get(metadata) ?? [];
  optMetadataAccessor.set(metadata, [...stored, desc]);
}

const argMetadataAccessor = prepareMetadataAccessor<ArgDescriptor[]>(
  "classopt-arg",
);

function getArgs(metadata: DecoratorMetadata): ArgDescriptor[] {
  return argMetadataAccessor.get(metadata) ?? [];
}

export function pushArg(metadata: DecoratorMetadata, desc: ArgDescriptor) {
  const stored = argMetadataAccessor.get(metadata) ?? [];
  argMetadataAccessor.set(metadata, [...stored, desc]);
}

const cmdMetadataAccessor = prepareMetadataAccessor<CmdDescriptor[]>(
  "classopt-cmd",
);

function getCmds(metadata: DecoratorMetadata): CmdDescriptor[] {
  return cmdMetadataAccessor.get(metadata) ?? [];
}

export function pushCmd(metadata: DecoratorMetadata, desc: CmdDescriptor) {
  const stored = cmdMetadataAccessor.get(metadata) ?? [];
  cmdMetadataAccessor.set(metadata, [...stored, desc]);
}

function normalizeArgs(argv: string[]): string[] {
  const combinedPattern = /^-[a-zA-Z0-9$]{2,}$/;
  return argv.flatMap((arg) => {
    if (combinedPattern.test(arg)) {
      return [...arg.slice(1)].map((c) => `-${c}`);
    }
    return [arg];
  });
}

const longKeyPattern = /^--[a-zA-Z0-9$]{2,}(-[a-zA-Z0-9$]+)*$/;
const shortKeyPattern = /^-[a-zA-Z0-9$]$/;

function validateOptDescriptors(cls: Constructor, metadata: DecoratorMetadata) {
  const opts = optMetadataAccessor.get(metadata) ?? [];
  for (const opt of opts) {
    const { long, short } = opt;

    if (long == null && short == null) {
      throw new errors.IndeterminateOptKeyError(cls.name, opt.prop);
    }

    if (long != null && !longKeyPattern.test(long)) {
      throw new errors.InvalidOptKeyError(cls.name, opt.prop, long);
    }
    if (short != null && !shortKeyPattern.test(short)) {
      throw new errors.InvalidOptKeyError(cls.name, opt.prop, short);
    }
  }

  const keys = new Set<string>();
  for (const opt of opts) {
    for (const key of [opt.long, opt.short]) {
      if (key == null) continue;
      if (keys.has(key)) {
        throw new errors.DuplicateOptKeyError(cls.name, opt.prop, key);
      }
      keys.add(key);
    }
  }
}

function validateArgDescriptors(cls: Constructor, metadata: DecoratorMetadata) {
  const args = argMetadataAccessor.get(metadata) ?? [];
  const notRequired = dropWhile(args, (arg) => arg.kind === "required");
  for (const arg of notRequired) {
    if (arg.kind === "required") {
      throw new errors.RequiredArgAfterOptionalError(cls.name, arg.prop);
    }
  }
  for (const arg of notRequired.slice(0, -1)) {
    if (arg.kind === "rest") {
      throw new errors.RestArgBeforeLastArgError(cls.name, arg.prop);
    }
  }
}

function validateCmdDescriptors(cls: Constructor, metadata: DecoratorMetadata) {
  const cmds = cmdMetadataAccessor.get(metadata) ?? [];
  const names = new Set<string>();
  for (const cmd of cmds) {
    const name = getName(cmd.command);
    if (names.has(name)) {
      throw new errors.DuplicateCommandNameError(cls.name, cmd.prop, name);
    }
    names.add(name);
  }

  for (const cmd of cmds) {
    validateMetadata(cmd.command);
  }
}

function validateMetadata(cls: Constructor) {
  const metadata = confirmDecoratorMetadata(cls);
  validateOptDescriptors(cls, metadata);
  validateArgDescriptors(cls, metadata);
  validateCmdDescriptors(cls, metadata);

  const args = argMetadataAccessor.get(metadata) ?? [];
  const cmds = cmdMetadataAccessor.get(metadata) ?? [];
  if (args.length > 0 && cmds.length > 0) {
    throw new errors.DefineBothArgAndCmdError(cls.name);
  }
}

type ParseContext = {
  // deno-lint-ignore no-explicit-any
  instance: any;
  q: Queue<string>;
  parsedKeys: Set<string>;
  optMap: Map<string, OptDescriptor>;
  argQueue: Queue<ArgDescriptor>;
  cmdMap: Map<string, CmdDescriptor>;
  skip: boolean;
};

function getOptMap(metadata: DecoratorMetadata): Map<string, OptDescriptor> {
  const opts = optMetadataAccessor.get(metadata) ?? [];
  const shortEntries = opts
    .filter((opt) => opt.short)
    .map((opt) => [opt.short!, opt] as const);
  const longEntries = opts
    .filter((opt) => opt.long)
    .map((opt) => [opt.long!, opt] as const);
  const entries = [...shortEntries, ...longEntries];
  return new Map(entries);
}

function getArgQueue(metadata: DecoratorMetadata): Queue<ArgDescriptor> {
  return new Queue(getArgs(metadata));
}

function getCmdMap(metadata: DecoratorMetadata): Map<string, CmdDescriptor> {
  const cmds = cmdMetadataAccessor.get(metadata) ?? [];
  const getCmdName = (cmd: CmdDescriptor) => getName(cmd.command);
  const entries = cmds.map((cmd) => [getCmdName(cmd), cmd] as const);
  return new Map(entries);
}

export function parse<T extends object>(
  cls: Constructor<T>,
  argv: string[],
): T {
  validateMetadata(cls);

  const instance = new cls();
  const metadata = confirmDecoratorMetadata(cls);
  const optMap = getOptMap(metadata);
  const argQueue = getArgQueue(metadata);
  const cmdMap = getCmdMap(metadata);

  const ctx: ParseContext = {
    instance,
    q: new Queue(normalizeArgs(argv)),
    parsedKeys: new Set(),
    optMap,
    argQueue,
    cmdMap,
    skip: false,
  };

  initWithMetadata(ctx);

  while (!ctx.q.empty() && !ctx.skip) {
    const input = ctx.q.peek();
    if (input === "--") {
      ctx.q.pop();
      parseRest(ctx);
    } else if (input.startsWith("-") && input !== "-") {
      parseOpt(ctx);
    } else if (!ctx.argQueue.empty()) {
      parseArg(ctx);
    } else if (ctx.cmdMap.size > 0) {
      parseCmd(ctx);
    } else {
      throw new errors.TooManyArgsError(instance);
    }
  }

  if (ctx.skip) {
    return instance;
  }

  const names = ctx.argQueue.rest()
    .filter((desc) => desc.kind === "required")
    .map((desc) => desc.name);
  if (names.length > 0) {
    throw new errors.MissingArgsError(names, instance);
  }

  return instance;
}

function initWithMetadata(ctx: ParseContext) {
  for (const opt of ctx.optMap.values()) {
    if (opt.multiple) {
      ctx.instance[opt.prop] = [];
    }
  }

  for (const arg of ctx.argQueue.all()) {
    if (arg.default != null) {
      ctx.instance[arg.prop] = arg.default;
    } else if (arg.kind === "rest") {
      ctx.instance[arg.prop] = [];
    }
  }
}

function parseRest(ctx: ParseContext) {
  while (!ctx.q.empty()) {
    if (ctx.argQueue.empty()) {
      throw new errors.TooManyArgsError(ctx.instance);
    }
    parseArg(ctx);
  }
}

function parseOpt(ctx: ParseContext) {
  const key = ctx.q.pop();
  const opt = ctx.optMap.get(key);
  if (opt == null) {
    throw new errors.UnknownOptKeyError(key, ctx.instance);
  }

  let val: unknown;
  if (!opt.decoder) {
    val = true;
  } else {
    if (ctx.q.empty()) {
      throw new errors.MissingOptValueError(key, ctx.instance);
    }
    const [err, decoded] = opt.decoder(ctx.q.pop());
    if (err != null) {
      throw new errors.InvalidArgError(err, ctx.instance);
    }
    val = decoded;
  }

  if (opt.multiple) {
    ctx.instance[opt.prop].push(val);
  } else {
    for (const key of [opt.long, opt.short]) {
      if (key == null) continue;
      if (ctx.parsedKeys.has(key)) {
        throw new errors.DuplicateOptValueError(key, ctx.instance);
      }
      ctx.parsedKeys.add(key);
    }
    ctx.instance[opt.prop] = val;
  }

  if (opt.stopEarly) {
    ctx.skip = true;
  }
}

function parseArg(ctx: ParseContext) {
  const { prop, kind, decoder } = ctx.argQueue.pop();
  if (kind !== "rest") {
    const arg = ctx.q.pop();
    const [err, decoded] = decoder(arg);
    if (err != null) {
      throw new errors.InvalidArgError(err, ctx.instance);
    }
    ctx.instance[prop] = decoded;
  } else {
    ctx.instance[prop] = ctx.q.rest().map((arg) => {
      const [err, decoded] = decoder(arg);
      if (err != null) {
        throw new errors.InvalidArgError(err, ctx.instance);
      }
      return decoded;
    });
  }
}

function parseCmd(ctx: ParseContext) {
  const input = ctx.q.pop();
  const cmd = ctx.cmdMap.get(input);
  if (cmd == null) {
    throw new errors.UnknownCommandNameError(input, ctx.instance);
  }
  const sub = parse(cmd.command, ctx.q.rest());
  ctx.instance[cmd.prop] = sub;
  setParentCommand(sub, ctx.instance);
}

function optTable(opts: OptDescriptor[]): TextBuilder {
  const vals = opts
    .map((desc) => {
      const { type, about, long, short } = desc;
      let usage = [short, long].filter(Boolean).join(", ");
      if (type !== "boolean") {
        usage = `${usage} <${type}>`;
      }
      return { usage, about: about ?? "" };
    });
  if (vals.length === 0) return null;
  return ["", "OPTIONS", indentation(textTable(vals, ["usage", "about"]))];
}

function argTable(args: ArgDescriptor[]): TextBuilder {
  const vals = args
    .map((desc) => {
      const { name, about, kind } = desc;
      let usage;
      if (kind === "required") {
        usage = `<${name || "input"}>`;
      } else if (kind === "optional") {
        usage = `[${name || "input"}]`;
      } else if (kind === "rest") {
        usage = `[${name || "input"}]...`;
      } else {
        throw new errors.InternalError("unreachable");
      }
      return { usage, about: about ?? "" };
    });

  if (vals.length === 0) return null;
  return ["", "ARGS", indentation(textTable(vals, ["usage", "about"]))];
}

function cmdTable(cmds: CmdDescriptor[]): TextBuilder {
  if (cmds.length === 0) return [];
  const vals = cmds.map((desc) => {
    const { command } = desc;
    return {
      usage: getName(command),
      about: getAbout(command) ?? "",
    };
  });
  return ["", "COMMANDS", indentation(textTable(vals, ["usage", "about"]))];
}

function repeat<T>(a: T, fn: (a: T) => T | null): T[] {
  const result = [];
  let current: T | null = a;
  while (current !== null) {
    result.unshift(current);
    current = fn(current);
  }
  return result;
}

export function help<T extends object>(target: T): string {
  const usage = [];
  const cls = target.constructor as Constructor<T>;
  const name = getName(cls);
  const about = getAbout(cls);
  const stack = repeat(target, getParentCommand).map((i) =>
    getName(i.constructor as Constructor)
  );
  usage.push(stack.join(" "));

  const metadata = confirmDecoratorMetadata(cls);
  const opts = getOpts(metadata);
  const args = getArgs(metadata);
  const cmds = getCmds(metadata);

  if (opts.length > 0) {
    usage.push("[OPTIONS]");
  }
  if (args.length > 0) {
    for (const { name, kind } of args) {
      if (kind === "required") {
        usage.push(`<${name || "input"}>`);
      } else if (kind === "optional") {
        usage.push(`[${name || "input"}]`);
      } else if (kind === "rest") {
        usage.push(`[${name || "input"}]...`);
      } else {
        throw new errors.InternalError("unreachable");
      }
    }
  }
  if (cmds.length > 0) {
    usage.push("<SUBCOMMAND>");
  }

  return buildText(
    about ? `${name} - ${about}` : name,
    "USAGE",
    indentation(usage.join(" ")),
    optTable(opts),
    cmdTable(cmds),
    argTable(args),
  );
}
