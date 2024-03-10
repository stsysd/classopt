import { Arg, Cmd, Opt, parse, Rest } from "../mod.ts";
import { assertThrows } from "https://deno.land/std@0.214.0/assert/mod.ts";

Deno.test("duplicate long key", () => {
  assertThrows(() => {
    class Program {
      @Opt({ type: "string" })
      foo = "foo";

      @Opt({ type: "string", long: "foo" })
      bar = "bar";
    }
    parse(Program, []);
  });
});

Deno.test("duplicate short key", () => {
  assertThrows(() => {
    class Program {
      @Opt({ type: "string", short: true })
      foo = "foo";

      @Opt({ type: "string", short: "f" })
      bar = "foo-bar";
    }
    parse(Program, []);
  });
});

Deno.test("invalid key", () => {
  assertThrows(() => {
    class Program {
      @Opt({ type: "string" })
      "foo+bar" = "foo";
    }
    parse(Program, []);
  });
});

Deno.test("define required arg after optional args", () => {
  assertThrows(() => {
    class Program {
      @Arg({ optional: true })
      optional?: string;

      @Arg({ optional: false })
      required!: string;
    }
    parse(Program, ["a", "b"]);
  });
});

Deno.test("define rest args after other args", () => {
  assertThrows(() => {
    class Program {
      @Rest()
      rest!: string[];

      @Arg({ optional: true })
      required?: string;
    }
    parse(Program, ["a"]);
  });
});

Deno.test("define cmd after args", () => {
  assertThrows(() => {
    class Sub {}

    class Program {
      @Arg()
      required!: string;

      @Cmd(Sub)
      sub?: Sub;
    }
    parse(Program, ["a", "sub"]);
  });
});

Deno.test("define arg argments after cmd", () => {
  assertThrows(() => {
    class Sub {}

    class Program {
      @Cmd(Sub)
      sub?: Sub;

      @Arg()
      required!: string;
    }
    parse(Program, ["sub", "a"]);
  });
});

Deno.test("indetermin option key", () => {
  assertThrows(() => {
    class Program {
      @Opt({ long: false })
      foo = "";
    }
    parse(Program, ["--foo"]);
  });
});
