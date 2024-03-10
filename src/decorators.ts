import { defineName, pushArg, pushCmd, pushOpt } from "./parse.ts";
import { kebabify } from "./string.ts";
import type {
  ClassDecorator,
  ClassFieldDecorator,
  Constructor,
  Either,
} from "./types.ts";

type DecodeTypeMap = {
  string: string;
  number: number;
};

const Decoders = {
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

function optionKeys(
  name: string | symbol,
  opts: {
    long?: string | boolean;
    short?: string | boolean;
  },
): { long?: string; short?: string } {
  const keys = {} as {
    long?: string;
    short?: string;
  };
  const { long, short } = opts;

  if (long == null) {
    // default: generate from field name if possible
    if (typeof name === "string" && name.length > 1) {
      keys.long = kebabify(name);
    }
  } else if (long === true) {
    // true: generate from field name
    if (typeof name !== "string") {
      throw new Error("long option is not specified");
    }
    if (name.length <= 1) {
      throw new Error("long option must be longer than 1 character");
    }
    keys.long = kebabify(name);
  } else if (long !== false) {
    // string: use it as long option
    if (long.length <= 1) {
      throw new Error("long option must be longer than 1 character");
    }
    keys.long = long;
  }

  if (short == null) {
    // default: generate from field name if possible
    if (typeof name === "string" && name.length == 1) {
      keys.short = name;
    }
  } else if (short === true) {
    // true: generate from long option or field name
    if (keys.long) {
      keys.short = keys.long[0];
    } else if (typeof name === "string") {
      keys.short = name[0];
    } else {
      throw new Error("long option is not specified");
    }
  } else if (short !== false) {
    // string: use it as short option
    if (short.length != 1) {
      throw new Error("short option must be 1 character");
    }
    keys.short = short;
  }

  keys.short = keys.short && `-${keys.short}`;
  keys.long = keys.long && `--${keys.long}`;
  return keys;
}

export function Flag(
  opts: {
    about?: string;
    long?: string | boolean;
    short?: string | boolean;
  } = {},
): ClassFieldDecorator<boolean> {
  return (_: undefined, ctx: ClassFieldDecoratorContext) => {
    const keys = optionKeys(ctx.name, opts);
    pushOpt(ctx.metadata, {
      about: opts.about ?? "",
      prop: ctx.name,
      multiple: false,
      type: "boolean",
      ...keys,
    });
  };
}

export function Opt<TN extends keyof DecodeTypeMap = "string">(opts?: {
  type?: TN;
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple?: false;
}): ClassFieldDecorator<DecodeTypeMap[TN]>;

export function Opt<T>(opts?: {
  type: (arg: string) => Either<T>;
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple?: false;
}): ClassFieldDecorator<T>;

export function Opt<T>(opts?: {
  type: {
    name: string;
    decode(arg: string): Either<T>;
  };
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple?: false;
}): ClassFieldDecorator<T>;

export function Opt<TN extends keyof DecodeTypeMap = "string">(opts?: {
  type?: TN;
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple: true;
}): ClassFieldDecorator<DecodeTypeMap[TN][]>;

export function Opt<T>(opts?: {
  type: (arg: string) => Either<T>;
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple: true;
}): ClassFieldDecorator<T[]>;

export function Opt<T>(opts?: {
  type: {
    name: string;
    decode(arg: string): Either<T>;
  };
  about?: string;
  long?: string | boolean;
  short?: string | boolean;
  multiple: true;
}): ClassFieldDecorator<T[]>;

export function Opt(
  opts: {
    type?:
      | keyof DecodeTypeMap
      | ((arg: string) => Either<unknown>)
      | {
        decode: (arg: string) => Either<unknown>;
        name: string;
      };
    about?: string;
    long?: string | boolean;
    short?: string | boolean;
    multiple?: boolean;
  } = {},
): ClassFieldDecorator {
  return (_: undefined, ctx: ClassFieldDecoratorContext) => {
    const keys = optionKeys(ctx.name, opts);
    const { type, about, multiple } = opts;
    if (typeof type === "string") {
      pushOpt(ctx.metadata, {
        about: about ?? "",
        prop: ctx.name,
        multiple: multiple ?? false,
        type,
        decoder: Decoders[type],
        ...keys,
      });
    } else if (typeof type === "function") {
      pushOpt(ctx.metadata, {
        about: about ?? "",
        prop: ctx.name,
        multiple: multiple ?? false,
        type: "input",
        decoder: type,
        ...keys,
      });
    } else if (typeof type === "object") {
      pushOpt(ctx.metadata, {
        about: about ?? "",
        prop: ctx.name,
        multiple: multiple ?? false,
        type: type.name,
        decoder: type.decode,
        ...keys,
      });
    } else {
      pushOpt(ctx.metadata, {
        about: about ?? "",
        prop: ctx.name,
        multiple: multiple ?? false,
        type: "string",
        decoder: Decoders.string,
        ...keys,
      });
    }
  };
}

export function Arg<TN extends keyof DecodeTypeMap = "string">(opts?: {
  type?: TN;
  name?: string;
  about?: string;
  optional?: false;
}): ClassFieldDecorator<DecodeTypeMap[TN]>;

export function Arg<T>(opts?: {
  type: (arg: string) => Either<T>;
  name?: string;
  about?: string;
  optional?: false;
}): ClassFieldDecorator<T>;

export function Arg<T>(opts?: {
  type: {
    name: string;
    decode(arg: string): Either<T>;
  };
  name?: string;
  about?: string;
  optional?: false;
}): ClassFieldDecorator<T>;

export function Arg<TN extends keyof DecodeTypeMap = "string">(opts?: {
  name?: string;
  about?: string;
  optional: true;
}): ClassFieldDecorator<DecodeTypeMap[TN] | undefined>;

export function Arg<T>(opts?: {
  type: (arg: string) => Either<T>;
  name?: string;
  about?: string;
  optional: true;
}): ClassFieldDecorator<T | undefined>;

export function Arg<T>(opts?: {
  type: {
    name: string;
    decode(arg: string): Either<T>;
  };
  name?: string;
  about?: string;
  optional: true;
}): ClassFieldDecorator<T | undefined>;

export function Arg(
  opt: {
    type?:
      | keyof DecodeTypeMap
      | ((arg: string) => Either<unknown>)
      | {
        decode: (arg: string) => Either<unknown>;
        name: string;
      };
    name?: string;
    about?: string;
    optional?: boolean;
  } = {},
): ClassFieldDecorator {
  return (_: undefined, ctx: ClassFieldDecoratorContext) => {
    const { type, name, about, optional } = opt;
    if (typeof type === "string") {
      pushArg(ctx.metadata, {
        name: name ?? kebabify(ctx.name.toString()),
        about: about ?? "",
        prop: ctx.name,
        kind: optional ? "optional" : "required",
        type,
        decoder: Decoders[type],
      });
    } else if (typeof type === "function") {
      pushArg(ctx.metadata, {
        name: name ?? kebabify(ctx.name.toString()),
        about: about ?? "",
        prop: ctx.name,
        kind: optional ? "optional" : "required",
        type: "input",
        decoder: type,
      });
    } else if (typeof type === "object") {
      pushArg(ctx.metadata, {
        name: name ?? kebabify(ctx.name.toString()),
        about: about ?? "",
        prop: ctx.name,
        kind: optional ? "optional" : "required",
        type: type.name,
        decoder: type.decode,
      });
    } else {
      pushArg(ctx.metadata, {
        name: name ?? kebabify(ctx.name.toString()),
        about: about ?? "",
        prop: ctx.name,
        kind: optional ? "optional" : "required",
        type: "string",
        decoder: Decoders.string,
      });
    }
  };
}

export function Rest<TN extends keyof DecodeTypeMap = "string">(
  opts: {
    type?: TN;
    name?: string;
    about?: string;
  } = {},
): ClassFieldDecorator<DecodeTypeMap[TN][]> {
  return (_: undefined, ctx: ClassFieldDecoratorContext) => {
    pushArg(ctx.metadata, {
      name: opts.name ?? kebabify(ctx.name.toString()),
      about: opts.about ?? "",
      prop: ctx.name,
      kind: "rest",
      type: opts.type ?? "string",
      decoder: Decoders[opts.type ?? "string"],
    });
  };
}

export function Cmd<T extends object, Cs extends Constructor<T>[]>(
  ...subs: Cs
): ClassFieldDecorator<T | undefined> {
  return (_: undefined, ctx: ClassFieldDecoratorContext) => {
    for (const sub of subs) {
      pushCmd(ctx.metadata, {
        prop: ctx.name,
        command: sub,
      });
    }
  };
}

export function Name<T extends object, C extends Constructor<T>>(
  name: string,
): ClassDecorator<T, C> {
  return (_: C, ctx: ClassDecoratorContext) => {
    defineName(ctx, name);
  };
}
