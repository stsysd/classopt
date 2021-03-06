import { Constructor, kebabify } from "./utils.ts";
import { Either, pushArg, pushCmd, pushOpt, setName } from "./meta.ts";

const Decoders = {
  boolean: undefined,
  string(arg: string): Either<string> {
    return [null, arg];
  },
  number(arg: string): Either<number> {
    const n = parseFloat(arg);
    if (Number.isNaN(n)) {
      return [`argument '${arg}' is not number`];
    }
    return [null, n];
  },
} as const;

type DecodeTypeMap = {
  string: string;
  number: number;
};

export function Flag(opts: {
  about?: string;
  long?: string | false;
  short?: string | true;
} = {}): <K extends string | symbol>(
  target: { [key in K]?: boolean },
  prop: K,
) => void {
  return (target, prop) => {
    const keys = { long: "", short: "" };
    if (typeof prop === "string") {
      if (prop.length > 1) {
        keys.long = kebabify(prop);
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
      if (typeof short === "string") {
        keys.short = short[0];
      } else {
        keys.short = keys.long[0];
      }
    }

    keys.short = keys.short && `-${keys.short}`;
    keys.long = keys.long && `--${keys.long}`;

    pushOpt(target, {
      about: "",
      prop,
      multiple: false,
      $stopEarly: false,
      type: "boolean",
      ...keys,
      ...rest,
    });
  };
}

export function Opt<
  N extends keyof DecodeTypeMap = "string",
  Mul extends boolean = false,
>(opts?: {
  type?: N;
  about?: string;
  long?: string | false;
  short?: string | true;
  multiple?: Mul;
}): <K extends string | symbol>(
  target: {
    [key in K]?: Mul extends true ? DecodeTypeMap[N][] : DecodeTypeMap[N];
  },
  prop: K,
) => void;

export function Opt<T, Mul extends boolean = false>(opts: {
  type: (arg: string) => Either<T>;
  about?: string;
  long?: string | false;
  short?: string | true;
  multiple?: Mul;
}): <K extends string | symbol>(
  target: { [key in K]?: Mul extends true ? T[] : T },
  prop: K,
) => void;

export function Opt<T, Mul extends boolean = false>(opts: {
  type: {
    decode: (arg: string) => Either<T>;
    name: string;
  };
  about?: string;
  long?: string | false;
  short?: string | true;
  multiple?: Mul;
}): <K extends string | symbol>(
  target: { [key in K]?: Mul extends true ? T[] : T },
  prop: K,
) => void;

export function Opt(
  opts: {
    type?:
      | keyof DecodeTypeMap
      | ((arg: string) => Either<unknown>)
      | {
        name: string;
        decode: (arg: string) => Either<unknown>;
      };
    about?: string;
    long?: string | false;
    short?: string | true;
    multiple?: boolean;
  } = {},
): <K extends string | symbol>(
  target: { [key in K]?: unknown | unknown[] },
  prop: K,
) => void {
  return (target, prop) => {
    const keys = { long: "", short: "" };
    if (typeof prop === "string") {
      if (prop.length > 1) {
        keys.long = kebabify(prop);
      } else {
        keys.short = prop;
      }
    }

    const { long, short, type, ...rest } = opts;
    if (long) {
      keys.long = long;
    } else if (long != null) {
      keys.long = "";
    }

    if (short) {
      if (typeof short === "string") {
        keys.short = short[0];
      } else {
        keys.short = keys.long[0];
      }
    }

    keys.short = keys.short && `-${keys.short}`;
    keys.long = keys.long && `--${keys.long}`;

    let decoder = undefined;
    let typeName = "input";

    if (typeof type === "string" && type in Decoders) {
      decoder = Decoders[type];
      typeName = type;
    } else if (typeof type === "function") {
      decoder = type;
    } else if (type == null) {
      decoder = Decoders.string;
      typeName = "string";
    } else if (typeof type === "object") {
      decoder = type.decode;
      typeName = type.name;
    }

    pushOpt(target, {
      about: "",
      prop,
      multiple: !!opts.multiple,
      $stopEarly: false,
      type: typeName,
      decoder,
      ...keys,
      ...rest,
    });
  };
}

export function Arg<T = string, Op extends boolean = false>(
  opts: {
    name?: string;
    about?: string;
    optional?: Op;
  } = {},
): <K extends string>(
  target: Op extends false ? { [key in K]: T } : { [key in K]?: T },
  prop: K,
) => void {
  return (target, prop) => {
    const { optional, ...rest } = opts;
    pushArg(target, {
      name: kebabify(prop),
      about: "",
      prop,
      kind: optional ? "optional" : "required",
      type: "string",
      decoder: (s) => [null, s],
      ...rest,
    });
  };
}

export function Rest<N extends keyof DecodeTypeMap = "string">(
  opts: {
    name?: string;
    about?: string;
    type?: N;
  } = {},
): <K extends string>(
  target: { [key in K]: DecodeTypeMap[N][] },
  prop: K,
) => void {
  return (target, prop) => {
    pushArg(target, {
      name: kebabify(prop),
      about: "",
      prop,
      kind: "rest",
      type: "string",
      decoder: (s) => [null, s],
      ...opts,
    });
  };
}

// deno-lint-ignore ban-types
type Instance<Args extends Constructor<object>[]> = {
  [Ix in keyof Args]: Args[Ix] extends Constructor<infer T> ? T : never;
}[number];

// deno-lint-ignore ban-types
export function Cmd<Args extends Constructor<object>[]>(
  ...args: Args
): <P extends string>(
  target: { [key in P]?: Partial<Instance<Args>> },
  prop: P,
) => void {
  return (target, prop) => {
    for (const command of args) {
      pushCmd(target, { prop, command });
    }
  };
}

export function Name(name: string): ClassDecorator {
  return (target) => setName(target, name);
}
