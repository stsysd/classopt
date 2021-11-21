import * as errors from "./errors.ts";
import { Queue } from "./utils.ts";
import { metadata, initialize, OptTypeName, OptType } from "./meta.ts";

function consume(typ: OptTypeName, q: Queue<string>, key: string): OptType {
  if (typ === "boolean") {
    return true;
  }
  if (q.empty()) {
    throw new errors.MissingOptArg(key);
  }
  const arg = q.pop();
  if (typ === "string") {
    return arg;
  } else if (typ === "integer") {
    const i = parseInt(arg);
    if (Number.isNaN(i)) {
      throw new errors.MalformedArg(typ, arg);
    }
    return BigInt(i);
  }
  if (typ === "number") {
    const n = parseFloat(arg);
    if (Number.isNaN(n)) {
      throw new errors.MalformedArg(typ, arg);
    }
    return n;
  }
  throw "unreachable";
}

// deno-lint-ignore ban-types
export function parse<T extends object>(target: T, argv: string[]): T {
  initialize(target);
  const q = new Queue(argv);
  const meta = metadata(target);
  const keys = new Set();
  const argQ = new Queue(meta.args ?? []);

  while (!q.empty()) {
    const first = q.peek();
    if (first.startsWith("-") && first.length > 1) {
      const first = q.pop();
      const desc = meta.optMap.get(first);
      if (!desc) {
        throw new errors.UnknownOptKey(first);
      }
      const val = consume(desc.type, q, first);
      // deno-lint-ignore no-explicit-any
      (target as any)[desc.prop] = val;
      for (const key of [desc.short, desc.long]) {
        if (key === "") continue;
        if (keys.has(key)) {
          throw new errors.DuplicateOptValue(key);
        }
        keys.add(key);
      }
      if (desc.$stopEarly) return target;
    } else if (!argQ.empty()) {
      const desc = argQ.pop();
      const { prop } = desc;
      if (desc.kind != "rest") {
        // deno-lint-ignore no-explicit-any
        (target as any)[prop] = q.pop();
      } else {
        // deno-lint-ignore no-explicit-any
        (target as any)[prop] = q.rest();
      }
    } else if (meta.cmds != null && meta.cmdMap != null) {
      const [key, ...args] = q.rest();
      const desc = meta.cmdMap.get(key);
      if (desc == null) {
        throw new errors.UnknownCommandName(key);
      }
      const cmd = parse(new desc.command(), args);
      // deno-lint-ignore no-explicit-any
      (target as any)[desc.prop] = cmd;
      return target;
    } else {
      throw new errors.InternalError("malformed metadata");
    }
  }
  if (argQ != null && !argQ.empty() && argQ.peek().kind === "required") {
    const names = argQ
      .rest()
      .filter((desc) => desc.kind === "required")
      .map((desc) => desc.name);
    throw new errors.MissingArgs(...names);
  }
  return target;
}
