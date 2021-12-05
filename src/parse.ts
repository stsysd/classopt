import * as errors from "./errors.ts";
import { Queue } from "./utils.ts";
import { metadata, initialize } from "./meta.ts";

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
  initialize(target);
  const q = new Queue(normalizeArgs(argv));
  const meta = metadata(target);
  const keys = new Set();
  const argQ = new Queue(meta.args ?? []);

  while (!q.empty()) {
    if (q.peek().startsWith("-") && q.peek().length > 1) {
      const key = q.pop();
      const desc = meta.optMap.get(key);
      if (!desc) {
        throw new errors.UnknownOptKey(key, target);
      }

      let val: unknown;
      if (desc.decoder) {
        if (q.empty()) {
          throw new errors.MissingOptArg(key, target);
        }
        const [err, ret] = desc.decoder(q.pop());
        if (err != null) {
          throw new errors.InvalidArg(err, target);
        }
        val = ret;
      } else {
        val = true;
      }

      if (desc.multiple) {
        // deno-lint-ignore no-explicit-any
        (target as any)[desc.prop].push(val);
      } else {
        // deno-lint-ignore no-explicit-any
        (target as any)[desc.prop] = val;
      }

      if (!desc.multiple) {
        for (const key of [desc.short, desc.long]) {
          if (key === "") continue;
          if (keys.has(key)) {
            throw new errors.DuplicateOptValue(key, target);
          }
          keys.add(key);
        }
      }
      if (desc.$stopEarly) return target;
    } else if (!argQ.empty()) {
      const desc = argQ.pop();
      const { prop } = desc;
      if (desc.kind != "rest") {
        const [err, val] = desc.decoder(q.pop());
        if (err) {
          throw new errors.InvalidArg(err, target);
        }
        // deno-lint-ignore no-explicit-any
        (target as any)[prop] = val;
      } else {
        // deno-lint-ignore no-explicit-any
        (target as any)[prop] = q.rest().map((s) => {
          const [err, val] = desc.decoder(s);
          if (err) {
            throw new errors.InvalidArg(err, target);
          }
          return val;
        });
      }
    } else if (meta.cmds != null && meta.cmdMap != null) {
      const [key, ...args] = q.rest();
      const desc = meta.cmdMap.get(key);
      if (desc == null) {
        throw new errors.UnknownCommandName(key, target);
      }
      const cmd = parse(new desc.command(), args);
      // deno-lint-ignore no-explicit-any
      (target as any)[desc.prop] = cmd;
      return target;
    } else {
      throw new errors.TooManyArgs(target);
    }
  }
  if (argQ != null && !argQ.empty() && argQ.peek().kind === "required") {
    const names = argQ
      .rest()
      .filter((desc) => desc.kind === "required")
      .map((desc) => desc.name);
    throw new errors.MissingArgs(names, target);
  }
  return target;
}
