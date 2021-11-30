export class InternalError extends Error {}

export class DefinitionError extends Error {}

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

export class ParseError extends Error {
  // deno-lint-ignore ban-types
  public readonly target: object;
  public readonly exitCode: number;

  // deno-lint-ignore ban-types
  constructor(msg: string, target: object, exitCode: number = 1) {
    super(msg);
    this.target = target;
    this.exitCode = exitCode;
  }
}

export class DuplicateOptValue extends ParseError {
  // deno-lint-ignore ban-types
  constructor(key: string, target: object) {
    super(`Option with "${key}" specified mutilple time`, target);
  }
}

export class UnknownOptKey extends ParseError {
  // deno-lint-ignore ban-types
  constructor(key: string, target: object) {
    super(`Option with "${key}" is not defined`, target);
  }
}

export class UnknownCommandName extends ParseError {
  // deno-lint-ignore ban-types
  constructor(name: string, target: object) {
    super(`Command "${name}" is not defined`, target);
  }
}

export class MissingOptArg extends ParseError {
  // deno-lint-ignore ban-types
  constructor(key: string, target: object) {
    super(`Missing argument for option with "${key}"`, target);
  }
}

export class MissingArgs extends ParseError {
  // deno-lint-ignore ban-types
  constructor(names: string[], target: object) {
    super(
      `Missing argments: ${names.map((name) => `<${name}>`).join(" ")}`,
      target
    );
  }
}

export class TooManyArgs extends ParseError {
  // deno-lint-ignore ban-types
  constructor(target: object) {
    super("Too many arguments", target);
  }
}

export class MalformedArg extends ParseError {
  // deno-lint-ignore ban-types
  constructor(typ: string, arg: string, target: object) {
    super(`Argument "${arg}" cannot be parsed into ${typ}`, target);
  }
}
