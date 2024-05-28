export type Either<T> = [error: string] | [error: null, result: T];

export type Constructor<
  T extends object = object,
  Args extends unknown[] = unknown[],
> = {
  new (...args: Args): T;
};

export type ClassDecorator<
  T extends object = object,
  C extends Constructor<T> = Constructor<T>,
> = (
  target: C,
  ctx: ClassDecoratorContext,
) => C | void;

// deno-lint-ignore no-explicit-any
export type ClassFieldDecorator<T = any, This = unknown> = (
  target: undefined,
  ctx: ClassFieldDecoratorContext,
) => ((this: This, initialValue: T) => T) | void;
