import "./workaround.ts";

// deno-lint-ignore ban-types
export function confirmDecoratorMetadata(fn: Function): DecoratorMetadata {
  const meta = fn[Symbol.metadata];
  if (meta != null) {
    return meta;
  }
  Object.defineProperty(fn, Symbol.metadata, {
    value: {},
    writable: true,
    enumerable: false,
  });
  return fn[Symbol.metadata]!;
}

export type MetadataAccessor<V> = {
  get(meta: DecoratorMetadata): V | null;
  set(meta: DecoratorMetadata, val: V): void;
};

export function prepareMetadataAccessor<V = unknown>(
  key?: string,
): MetadataAccessor<V> {
  const sym = Symbol(key);

  return {
    get(meta) {
      return (meta[sym] as V) ?? null;
    },
    set(meta, val) {
      meta[sym] = val;
    },
  };
}
