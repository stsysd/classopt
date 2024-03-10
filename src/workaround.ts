if (!("metadata" in Symbol)) {
  (Symbol as { metadata: symbol }).metadata = (() => {
    function deco(_: unknown, _ctx: DecoratorContext) {}
    @deco
    class Dummy {}
    for (const key of Reflect.ownKeys(Dummy)) {
      if (typeof key === "symbol") {
        return key;
      }
    }
    throw new Error("Symbol.metadata not found");
  })();
}
