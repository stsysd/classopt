export type Constructor<
  T extends object,
  Args extends unknown[] = unknown[],
> = {
  new (...args: Args): T;
};

export function kebabify(s: string): string {
  if (s.length === 0) return s;
  return (
    s[0].toLowerCase() +
    s
      .slice(1)
      .replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      .replaceAll("_", "-")
  );
}

export function camelify(s: string): string {
  return s.replaceAll(/-|_./g, (s) => s[1].toUpperCase());
}

export class EmptyQueue extends Error {
  constructor() {
    super("cannot pop value from empty queue");
  }
}

export class Queue<T> {
  private values: readonly T[];
  private index = 0;

  constructor(vals: readonly T[]) {
    this.values = vals;
  }

  peek(): T {
    return this.values[this.index];
  }

  pop(): T {
    if (this.index >= this.values.length) {
      throw new EmptyQueue();
    }
    const rv = this.values[this.index];
    this.index += 1;
    return rv;
  }

  empty(): boolean {
    return this.index >= this.values.length;
  }

  rest(): T[] {
    if (this.index >= this.values.length) {
      return [];
    }
    const rv = this.values.slice(this.index);
    this.index = this.values.length;
    return rv;
  }
}

/*
export function mapValues<V, U>(
  m: Record<string, V>,
  fn: (v: V) => U
): Record<string, U> {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, fn(v)]));
}
*/
