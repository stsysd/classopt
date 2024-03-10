import {
  Arg,
  Cmd,
  Command,
  Help,
  help,
  Name,
  Opt,
  Rest,
  Version,
} from "../mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.214.0/testing/snapshot.ts";

Deno.test("snapshot help", async (t) => {
  class Program {
    @Opt({ type: "string", short: "s", long: "str" })
    foo = "foo";

    @Arg({ about: "about bar arg" })
    bar!: string;

    @Arg({ optional: true })
    baz?: string;

    @Rest({ about: "about rest args" })
    rest!: string[];
  }

  await assertSnapshot(t, help(new Program()));
});

Deno.test("snapshot help (Command)", async (t) => {
  @Name("hoge")
  @Version("1.0.0")
  @Help("this is a hoge program")
  class Program extends Command {
    @Opt({ type: "string", short: "s", long: "str" })
    foo = "foo";

    @Arg({ about: "about bar arg" })
    bar!: string;

    @Arg({ optional: true })
    baz?: string;

    @Rest({ about: "about rest args" })
    rest!: string[];

    execute() {
      // do nothing
    }
  }

  await assertSnapshot(t, help(new Program()));
});

Deno.test("snapshot help (sub)", async (t) => {
  @Name("hoge")
  class Sub {
  }

  class Program {
    @Opt({ type: "string", short: "s", long: "str" })
    foo = "foo";

    @Cmd(Sub)
    sub?: Sub;
  }

  await assertSnapshot(t, help(new Program()));
});
