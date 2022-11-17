import { Arg, Cmd, Opt, Rest } from "../mod.ts";
import { assertThrows } from "./deps.ts";

Deno.test("duplicate long key", () => {
  assertThrows(() => {
    class _Opt {
      @Opt({ type: "string" })
      foo = "foo";

      @Opt({ type: "string", long: "foo" })
      bar = "bar";
    }
  });
});

Deno.test("duplicate short key", () => {
  assertThrows(() => {
    class _Opt {
      @Opt({ type: "string", short: true })
      foo = "foo";

      @Opt({ type: "string", short: "f" })
      bar = "foo-bar";
    }
  });
});

Deno.test("invalid key", () => {
  assertThrows(() => {
    class _Opt {
      @Opt({ type: "string" })
      "foo+bar" = "foo";
    }
  });
});

Deno.test("define required arg after optional args", () => {
  assertThrows(() => {
    class _Opt {
      @Arg({ optional: true })
      optional?: string;

      @Arg({ optional: false })
      required = "";
    }
  });
});

Deno.test("define rest args after other args", () => {
  assertThrows(() => {
    class _Opt {
      @Rest()
      rest = [];

      @Arg({ optional: true })
      required = "";
    }
  });
});

Deno.test("define cmd after args", () => {
  assertThrows(() => {
    class Sub {}

    class _Opt {
      @Arg()
      required = "";

      @Cmd(Sub)
      sub?: Sub;
    }
  });
});

Deno.test("define arg argments after cmd", () => {
  assertThrows(() => {
    class Sub {}

    class _Opt {
      @Arg()
      required = "";

      @Cmd(Sub)
      sub?: Sub;
    }
  });
});

Deno.test("indetermin option key", () => {
  assertThrows(() => {
    class _Opt {
      @Opt({ long: false })
      foo = "";
    }
  });
});
