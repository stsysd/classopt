import { Constructor, kebabify } from "./utils.ts";
import {
  OptTypeName,
  OptType,
  pushOpt,
  pushArg,
  pushCmd,
  setName,
} from "./meta.ts";

export function Opt<N extends OptTypeName = "boolean", V = OptType<N>>(
  opts: {
    about?: string;
    type?: N;
    long?: string | false;
    short?: string | false;
  } = {}
): <K extends string | symbol>(target: { [key in K]?: V }, prop: K) => void {
  return (target, prop) => {
    const keys = { long: "", short: "" };
    if (typeof prop === "string") {
      if (prop.length > 1) {
        keys.long = kebabify(prop);
        keys.short = keys.long[0];
      } else {
        keys.short = prop;
      }
    }

    const { long, short, ...rest } = opts;
    if (long) {
      keys.long = long;
    } else if (long != null) {
      keys.long = "";
    }

    if (short) {
      keys.short = short[0];
    } else if (short != null) {
      keys.short = "";
    }

    keys.short = keys.short && `-${keys.short}`;
    keys.long = keys.long && `--${keys.long}`;

    pushOpt(target, {
      about: "",
      prop,
      type: "boolean",
      $stopEarly: false,
      ...keys,
      ...rest,
    });
  };
}

export function Arg(
  opts: {
    name?: string;
    about?: string;
    optional?: boolean;
  } = {}
): <K extends string>(target: { [key in K]: string }, prop: K) => void {
  return (target, prop) => {
    const { optional, ...rest } = opts;
    pushArg(target, {
      name: kebabify(prop),
      about: "",
      prop,
      kind: optional ? "optional" : "required",
      ...rest,
    });
  };
}

export function Rest(
  opts: {
    name?: string;
    about?: string;
  } = {}
): <K extends string>(target: { [key in K]: string[] }, prop: K) => void {
  return (target, prop) => {
    pushArg(target, {
      name: kebabify(prop),
      about: "",
      prop,
      kind: "rest",
      ...opts,
    });
  };
}

type Common<
  Args extends unknown[],
  U extends Args[number] = Args[number],
  K extends keyof U = keyof U
> = { [key in K]: U[key] };

// deno-lint-ignore ban-types
export function Cmd<Args extends Constructor<object>[]>(
  ...cmds: Args
): <K extends string>(
  target: {
    [key in K]?: Common<{
      [Ix in keyof Args]: Args[Ix] extends Constructor<infer T> ? T : never;
    }>;
  },
  prop: K
) => void {
  return (target, prop) => {
    for (const command of cmds) {
      pushCmd(target, { prop, command });
    }
  };
}

export function Name(name: string): ClassDecorator {
  return (target) => setName(target, name);
}
