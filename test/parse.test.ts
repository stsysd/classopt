import { Arg, Cmd, Flag, Name, Opt, parse } from "../mod.ts";
import {
  assertObjectMatch,
  assertThrows,
} from "https://deno.land/std@0.114.0/testing/asserts.ts";
import { permutations } from "https://deno.land/std@0.114.0/collections/permutations.ts";

Deno.test("parse options", async (suite: Deno.TestContext) => {
  class Option {
    @Opt({ type: "string", short: "s" })
    str = "default";

    @Opt({ type: "number" })
    num = 0;

    @Flag()
    bool = false;

    @Arg()
    input = "";
  }

  await suite.step(
    "no option",
    () =>
      assertObjectMatch(parse(new Option(), ["INPUT"]), {
        str: "default",
        num: 0,
        bool: false,
        input: "INPUT",
      }),
  );

  await suite.step("permutations", async (sub) => {
    const base = ["--str string", "--num 3.14", "--bool", "INPUT"];
    const exp = {
      str: "string",
      num: 3.14,
      bool: true,
      input: "INPUT",
    };
    for (const p of permutations(base)) {
      const args = p.join(" ").split(" ");
      await sub.step(
        args.join(" "),
        () => assertObjectMatch(parse(new Option(), args), exp),
      );
    }
  });

  await suite.step("double dash", () => {
    const args = ["--", "--unknown"];
    const exp = {
      str: "default",
      num: 0,
      bool: false,
      input: "--unknown",
    };
    assertObjectMatch(parse(new Option(), args), exp);
  });

  await suite.step(
    "lack of required arg",
    () => assertThrows(() => parse(new Option(), ["--str", "string"])),
  );
  await suite.step(
    "too many args",
    () => assertThrows(() => parse(new Option(), ["foo", "bar", "baz"])),
  );
  await suite.step(
    "duplicate otion",
    () =>
      assertThrows(() =>
        parse(new Option(), ["INPUT", "--str", "foo", "-s", "bar"])
      ),
  );
  await suite.step(
    "fail to parse into integer",
    () => assertThrows(() => parse(new Option(), ["INPUT", "--int", "hello"])),
  );
  await suite.step(
    "fail to parse into number",
    () => assertThrows(() => parse(new Option(), ["INPUT", "--num", "hello"])),
  );
  await suite.step(
    "arg to bool opt",
    () => assertThrows(() => parse(new Option(), ["INPUT", "--bool", "hello"])),
  );
  await suite.step(
    "no arg to not bool opt",
    () => assertThrows(() => parse(new Option(), ["INPUT", "-s"])),
  );
  await suite.step(
    "unknown option",
    () => assertThrows(() => parse(new Option(), ["INPUT", "--unk"])),
  );
});

Deno.test("option key conversion", async (suite) => {
  class Option {
    @Opt({ type: "string" })
    CamelCaseProp = "";

    @Opt({ type: "string" })
    s = "";

    @Opt({ type: "string", long: false, short: "f" })
    foo = "";

    @Opt({ type: "string", short: "x" })
    bar = "";
  }

  await suite.step("short option", () =>
    assertObjectMatch(
      parse(new Option(), [
        "--camel-case-prop",
        "CAMEL_CASE",
        "-s",
        "SHORT",
        "-f",
        "FOO",
        "-x",
        "BAR",
      ]),
      {
        CamelCaseProp: "CAMEL_CASE",
        s: "SHORT",
        foo: "FOO",
        bar: "BAR",
      },
    ));

  await suite.step(
    "disable long otpion",
    () => assertThrows(() => parse(new Option(), ["--foo", "FOO"])),
  );
});

Deno.test("combined keys", async (suite) => {
  class Option {
    @Flag({ short: "f" })
    foo = false;

    @Flag({ short: "b" })
    bar = false;

    @Flag({ short: "z" })
    baz = false;

    @Opt({ type: "string", short: "q" })
    qux = "";
  }

  await suite.step(
    "flag only",
    () =>
      assertObjectMatch(parse(new Option(), ["-fz"]), {
        foo: true,
        bar: false,
        baz: true,
      }),
  );

  await suite.step(
    "with argment",
    () =>
      assertObjectMatch(parse(new Option(), ["-bq", "QUX"]), {
        foo: false,
        bar: true,
        baz: false,
        qux: "QUX",
      }),
  );
});

Deno.test("multiple key", () => {
  class Option {
    @Opt({ multiple: true, short: true })
    foo?: string[];
  }

  assertObjectMatch(parse(new Option(), []), {
    foo: [],
  });

  assertObjectMatch(
    parse(new Option(), ["-f", "one", "-f", "two", "-f", "three"]),
    {
      foo: ["one", "two", "three"],
    },
  );
});

Deno.test("subcommand", async (suite) => {
  class Foo {
    type = "foo";

    @Arg()
    inputFoo = "";

    @Flag()
    foo = false;
  }

  class BarBaz {
    type = "barbaz";

    @Arg()
    inputBar = "";

    @Flag()
    baz = false;
  }

  @Name("hoge")
  class Qux {
    type = "qux";
  }

  class Root {
    @Cmd(Foo, BarBaz, Qux)
    command?: Foo | BarBaz | Qux;
  }

  await suite.step(
    "empty",
    () => assertObjectMatch(parse(new Root(), []), { command: undefined }),
  );

  await suite.step(
    "normal",
    () =>
      assertObjectMatch(parse(new Root(), ["foo", "input", "--foo"]), {
        command: { type: "foo", inputFoo: "input", foo: true },
      }),
  );

  await suite.step(
    "kebabify",
    () =>
      assertObjectMatch(parse(new Root(), ["bar-baz", "input"]), {
        command: { type: "barbaz", inputBar: "input", baz: false },
      }),
  );

  await suite.step(
    "renamed",
    () =>
      assertObjectMatch(parse(new Root(), ["hoge"]), {
        command: { type: "qux" },
      }),
  );

  await suite.step(
    "unknown",
    () => assertThrows(() => parse(new Root(), ["foobar"])),
  );

  await suite.step("not effect on other commands", () => {
    assertThrows(() => parse(new Root(), ["foo", "input", "--baz"]));
    assertThrows(() => parse(new Root(), ["bar-baz", "input", "--foo"]));
  });
});
