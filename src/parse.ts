import * as errors from "./errors.ts";
import { Queue } from "./utils.ts";
import {
  ArgDescriptor,
  initialize,
  MetaData,
  metadata,
  OptDescriptor,
} from "./meta.ts";

function normalizeArgs(argv: string[]): string[] {
  const combinedPattern = /^-[a-zA-Z0-9$]{2,}$/;
  return argv.flatMap((arg) => {
    if (combinedPattern.test(arg)) {
      return [...arg.slice(1)].map((c) => `-${c}`);
    }
    return [arg];
  });
}

// deno-lint-ignore ban-types
export function parse<T extends object>(target: T, argv: string[]): T {
  new Parser(target).parse(argv);
  return target;
}

class Parser {
  // deno-lint-ignore no-explicit-any
  target: any;
  meta: MetaData;
  argDescQ: Queue<ArgDescriptor>;
  parsedOptKeys: Set<string>;
  skip = false;

  // deno-lint-ignore no-explicit-any
  constructor(target: any) {
    initialize(target);
    this.target = target;
    this.meta = metadata(target);
    this.argDescQ = new Queue(this.meta.args ?? []);
    this.parsedOptKeys = new Set();
  }

  parse(args: string[]) {
    const q = new Queue(normalizeArgs(args));
    while (!q.empty()) {
      const arg = q.pop();
      if (arg === "--") {
        this.parseRest(q);
      } else if (arg.startsWith("-") && arg.length > 1) {
        this.parseOpt(arg, q);
      } else if (!this.argDescQ.empty()) {
        this.parseArg(arg, q);
      } else if (this.meta.cmds) {
        this.parseCmd(arg, q);
      } else {
        throw new errors.TooManyArgs(this.target);
      }

      if (this.skip) {
        return;
      }
    }
    const names = this.argDescQ.rest().filter((desc) =>
      desc.kind === "required"
    ).map((desc) => desc.name);
    if (names.length > 0) {
      throw new errors.MissingArgs(names, this.target);
    }
  }

  parseRest(q: Queue<string>) {
    while (!q.empty()) {
      const arg = q.pop();
      this.parseArg(arg, q);
    }
  }

  parseOpt(arg: string, q: Queue<string>) {
    const desc = this.meta.optMap.get(arg);
    if (desc == null) {
      throw new errors.UnknownOptKey(arg, this.target);
    }

    if (desc.decoder) {
      if (q.empty()) {
        throw new errors.MissingOptArg(arg, this.target);
      }
      const val = q.pop();
      const [err, ret] = desc.decoder(val);
      if (err != null) {
        throw new errors.InvalidArg(err, this.target);
      }
      this.updatePropByOpt(desc, ret);
    } else {
      this.updatePropByOpt(desc, true);
    }

    if (desc.$stopEarly) {
      // discard rest
      q.rest();
      this.skip = true;
    }
  }

  updatePropByOpt(desc: OptDescriptor, val: unknown) {
    if (desc.multiple) {
      this.target[desc.prop].push(val);
      return;
    }

    this.assertDuplicateOpt(desc);
    this.target[desc.prop] = val;
    this.parsedOptKeys.add(desc.short);
    this.parsedOptKeys.add(desc.long);
  }

  assertDuplicateOpt(desc: OptDescriptor) {
    for (const key of [desc.short, desc.long]) {
      if (key === "") continue;
      if (this.parsedOptKeys.has(key)) {
        throw new errors.DuplicateOptValue(key, this.target);
      }
    }
  }

  parseArg(arg: string, q: Queue<string>) {
    const { prop, kind, decoder } = this.argDescQ.pop();
    if (kind !== "rest") {
      const [err, val] = decoder(arg);
      if (err) {
        throw new errors.InvalidArg(err, this.target);
      }
      this.target[prop] = val;
    } else {
      this.target[prop] = q.rest().map((s) => {
        const [err, val] = decoder(s);
        if (err) {
          throw new errors.InvalidArg(err, this.target);
        }
        return val;
      });
    }
  }

  parseCmd(arg: string, q: Queue<string>) {
    const desc = this.meta.cmdMap?.get(arg);
    if (desc == null) {
      throw new errors.UnknownCommandName(arg, this.target);
    }
    const cmd = new desc.command();
    new Parser(cmd).parse(q.rest());
    this.target[desc.prop] = cmd;
  }
}
