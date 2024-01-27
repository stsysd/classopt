import * as errors from "./errors.ts";
import { Constructor, kebabify } from "./utils.ts";

export type Either<T> = [error: string | null, result?: T];
export type Decoder<T> = (arg: string) => Either<T>;

export type OptDescriptor = {
  about: string;
  prop: string | symbol;
  long: string;
  short: string;
  multiple: boolean;
  $stopEarly: boolean;
  type: string;
  decoder?: Decoder<unknown>;
};

export type ArgDescriptor = {
  about: string;
  name: string;
  prop: string | symbol;
  kind: "required" | "optional" | "rest";
  type: string;
  decoder: Decoder<unknown>;
};

export type CommandDescriptor = {
  prop: string | symbol;
  command: Constructor<object>;
};

export type Initializer<T = unknown> = {
  prop: string | symbol;
  init(): T;
};

const CLASSOPT_META = Symbol("metadata for classopt");

export type MetaData = {
  opts: OptDescriptor[];
  optMap: Map<string, OptDescriptor>;
  args: ArgDescriptor[] | null;
  cmds: CommandDescriptor[] | null;
  cmdMap: Map<string, CommandDescriptor> | null;
  inits: Initializer[];
};

type MetaDataHolder = { [CLASSOPT_META]: MetaData };

function confirmMetaData(_target: object): asserts _target is MetaDataHolder {
  if (_target == null) {
    throw new errors.InternalError("primitive value never has metadata");
  }
  const target = _target as MetaDataHolder;
  if (Object.prototype.hasOwnProperty.call(target, CLASSOPT_META)) return;
  if (Reflect.has(target, CLASSOPT_META)) {
    const { opts, optMap, args, cmds, cmdMap, inits, ...rest } =
      target[CLASSOPT_META];
    Object.defineProperty(target, CLASSOPT_META, {
      enumerable: false,
      writable: true,
      value: {
        opts: [...opts],
        optMap: new Map(optMap),
        args: args ? [...args] : null,
        cmds: cmds ? [...cmds] : null,
        cmdMap: cmdMap ? new Map(cmdMap) : null,
        inits: [...inits],
        ...rest,
      },
    });
  } else {
    Object.defineProperty(target, CLASSOPT_META, {
      enumerable: false,
      writable: true,
      value: {
        opts: [],
        optMap: new Map(),
        args: [],
        cmds: [],
        cmdMap: new Map(),
        inits: [],
      },
    });
  }
}

export function metadata(target: object): MetaData {
  confirmMetaData(target);
  return target[CLASSOPT_META];
}

export function initialize(target: object): void {
  const meta = metadata(target);
  // deno-lint-ignore no-explicit-any
  const t = target as any;
  for (const { prop, init } of meta.inits) {
    if (t[prop] == null) {
      t[prop] = init();
    }
  }
}

const longKeyPattern = /^--[a-zA-Z0-9$]{2,}(-[a-zA-Z0-9$]+)*$/;
const shortKeyPattern = /^-[a-zA-Z0-9$]$/;

export function pushOpt(target: object, desc: OptDescriptor) {
  const meta = metadata(target);
  meta.opts.push(desc);
  if (desc.short) {
    if (!shortKeyPattern.test(desc.short)) {
      throw new errors.InvalidOptKey(target, desc.prop, desc.short);
    }
    if (meta.optMap.has(desc.short)) {
      throw new errors.DuplicateOptKey(target, desc.prop, desc.short);
    }
    meta.optMap.set(desc.short, desc);
  }
  if (desc.long) {
    if (!longKeyPattern.test(desc.long)) {
      throw new errors.InvalidOptKey(target, desc.prop, desc.long);
    }
    if (meta.optMap.has(desc.long)) {
      throw new errors.DuplicateOptKey(target, desc.prop, desc.long);
    }
    meta.optMap.set(desc.long, desc);
  }

  if (!desc.short && !desc.long) {
    throw new errors.IndeterminateOptKey(target, desc.prop);
  }

  if (desc.multiple) {
    meta.inits.push({
      prop: desc.prop,
      init() {
        return [];
      },
    });
  }
}

export function pushArg(target: object, desc: ArgDescriptor) {
  const meta = metadata(target);
  if (!meta.args) {
    throw new errors.DefineBothArgAndCmd(target);
  }
  const last = meta.args.slice(-1)[0];
  if (last) {
    if (last.kind === "rest") {
      throw new errors.DefineArgAfterRest(target, desc.prop);
    }
    if (last.kind === "optional" && desc.kind === "required") {
      throw new errors.DefineRequiredArgAfterOptional(target, desc.prop);
    }
  }
  meta.args.push(desc);
  meta.cmds = null;
  meta.cmdMap = null;
  if (desc.kind === "rest") {
    meta.inits.push({
      prop: desc.prop,
      init() {
        return [];
      },
    });
  }
}

export function pushCmd(target: object, desc: CommandDescriptor) {
  const meta = metadata(target);
  if (!meta.cmds || !meta.cmdMap) {
    throw new errors.DefineBothArgAndCmd(target);
  }
  meta.cmds.push(desc);
  const name = getName(desc.command);
  if (meta.cmdMap.has(name)) {
    throw new errors.DuplicateCommandName(target, desc.prop, name);
  }
  meta.cmdMap.set(name, desc);
  setParent(desc.command, target.constructor);
}

type MetaInfo<V> = {
  // deno-lint-ignore no-explicit-any
  get(target: any): V | null;
  // deno-lint-ignore no-explicit-any
  set(target: any, val: V): void;
};

function prepareMetaInfo<V = unknown>(key?: string): MetaInfo<V> {
  const sym = Symbol(key);

  return {
    get(target) {
      return (target[sym] as V) ?? null;
    },
    set(target, val) {
      target[sym] = val;
    },
  };
}

const MetaName = prepareMetaInfo<string>("name");

// deno-lint-ignore ban-types
export function getName(target: Function): string {
  return MetaName.get(target) ?? kebabify(target.name);
}

// deno-lint-ignore ban-types
export function setName(target: Function, name: string): void {
  MetaName.set(target, kebabify(name));
}

export const { get: getParent, set: setParent } =
  // deno-lint-ignore ban-types
  prepareMetaInfo<Function>("parent");
export const { get: getHelp, set: setHelp } = prepareMetaInfo<string>("help");
