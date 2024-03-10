export class InternalError extends Error {}

export class DefinitionError extends Error {}

export class InvalidOptKeyError extends DefinitionError {
  constructor(className: string, prop: string | symbol, key: string) {
    const loc = `${className}.${String(prop)}`;
    super(`option "${key}" is not valid at "${loc}"`);
  }
}

export class IndeterminateOptKeyError extends DefinitionError {
  constructor(className: string, prop: string | symbol) {
    const loc = `${className}.${String(prop)}`;
    super(`cannont determined key at "${loc}"`);
  }
}

export class DuplicateOptKeyError extends DefinitionError {
  constructor(className: string, prop: string | symbol, key: string) {
    const loc = `${className}.${String(prop)}`;
    super(`duplicate option with key "${key}" defined at "${loc}"`);
  }
}

export class DuplicateCommandNameError extends DefinitionError {
  constructor(className: string, prop: string | symbol, name: string) {
    const loc = `${className}.${String(prop)}`;
    super(`duplicate command with name "${name}" defined at "${loc}"`);
  }
}

export class RequiredArgAfterOptionalError extends DefinitionError {
  constructor(className: string, prop: string | symbol) {
    const loc = `${className}.${String(prop)}`;
    super(`required argument defined after optional arguments at "${loc}"`);
  }
}

export class RestArgBeforeLastArgError extends DefinitionError {
  constructor(className: string, prop: string | symbol) {
    const loc = `${className}.${String(prop)}`;
    super(`rest argument defined before last arguments at "${loc}"`);
  }
}

export class DefineBothArgAndCmdError extends DefinitionError {
  constructor(className: string) {
    super(`both of Arg and Cmd are defined at ${className}`);
  }
}

export class ParseError extends Error {
  public readonly target: object;
  public readonly exitCode: number;

  constructor(msg: string, target: object, exitCode: number = 1) {
    super(msg);
    this.target = target;
    this.exitCode = exitCode;
  }
}

export class DuplicateOptValueError extends ParseError {
  constructor(key: string, target: object) {
    super(`Option with "${key}" specified mutilple time`, target);
  }
}

export class UnknownOptKeyError extends ParseError {
  constructor(key: string, target: object) {
    super(`Option with "${key}" is not defined`, target);
  }
}

export class UnknownCommandNameError extends ParseError {
  constructor(name: string, target: object) {
    super(`Command "${name}" is not defined`, target);
  }
}

export class MissingOptValueError extends ParseError {
  constructor(key: string, target: object) {
    super(`Missing argument for option with "${key}"`, target);
  }
}

export class MissingArgsError extends ParseError {
  constructor(names: string[], target: object) {
    super(
      `Missing argments: ${names.map((name) => `<${name}>`).join(" ")}`,
      target,
    );
  }
}

export class TooManyArgsError extends ParseError {
  constructor(target: object) {
    super("Too many arguments", target);
  }
}

export class InvalidArgError extends ParseError {
  constructor(msg: string, target: object) {
    super(msg, target);
  }
}
