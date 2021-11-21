export class DefinitionError extends Error {}

export class ParseError extends Error {
  public readonly exitCode: number;

  constructor(msg: string, exitCode: number = 1) {
    super(msg);
    this.exitCode = exitCode;
  }
}

export class InternalError extends Error {}

export class InvalidOptKey extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol, key: string) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`option "${key}" is not valid at ${loc}`);
  }
}

export class IndeterminateOptKey extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`cannont determined key at ${loc}`);
  }
}

export class DuplicateOptKey extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol, key: string) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`duplicate option with key "${key}" defined at ${loc}`);
  }
}

export class DuplicateCommandName extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol, name: string) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`duplicate command with name "${name}" defined at ${loc}`);
  }
}

export class DefineRequiredArgAfterOptional extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`required argument defined after optional arguments at ${loc}`);
  }
}

export class DefineArgAfterRest extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object, prop: string | symbol) {
    const loc = `${target.constructor.name}.${String(prop)}`;
    super(`argument defined after rest arguments at ${loc}`);
  }
}

export class DefineBothArgAndCmd extends DefinitionError {
  // deno-lint-ignore ban-types
  constructor(target: object) {
    const name = target.constructor.name;
    super(`both of Arg and Cmd are defined in ${name}`);
  }
}

export class DuplicateOptValue extends ParseError {
  constructor(key: string) {
    super(`Option with "${key}" specified mutilple time`);
  }
}

export class UnknownOptKey extends ParseError {
  constructor(key: string) {
    super(`Option with "${key}" is not defined`);
  }
}

export class UnknownCommandName extends ParseError {
  constructor(name: string) {
    super(`Command "${name}" is not defined`);
  }
}

export class MissingOptArg extends ParseError {
  constructor(key: string) {
    super(`Missing argument for option with "${key}"`);
  }
}

export class MissingArgs extends ParseError {
  constructor(...names: string[]) {
    super(`Missing argments: ${names.map((name) => `<${name}>`).join(" ")}`);
  }
}

export class TooManyArgs extends ParseError {
  constructor() {
    super("Too many arguments");
  }
}

export class MalformedArg extends ParseError {
  constructor(typ: string, arg: string) {
    super(`Argument "${arg}" cannot be parsed into ${typ}`);
  }
}
