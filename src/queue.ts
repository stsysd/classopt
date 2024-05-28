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
    if (this.empty()) {
      throw new EmptyQueue();
    }
    const rv = this.values[this.index];
    this.index += 1;
    return rv;
  }

  empty(): boolean {
    return this.index >= this.values.length;
  }

  all(): readonly T[] {
    return this.values;
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
