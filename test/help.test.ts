import { Arg, Cmd, Command, Name, Version } from "../mod.ts";
import { assertSnapshot } from "./deps.ts";

Deno.test("simple command", async (t) => {
  @Name("program")
  @Version("0.1.0")
  class Cmd extends Command {
    @Arg()
    arg = "";

    execute() {
      return Promise.resolve();
    }
  }

  await assertSnapshot(t, new Cmd().help());
});

Deno.test("subcommands", async (t) => {
  class Foo extends Command {
    execute() {
      return Promise.resolve();
    }
  }

  @Name("baz")
  class Bar extends Command {
    execute() {
      return Promise.resolve();
    }
  }

  @Version("0.1.0")
  class Root extends Command {
    @Cmd(Foo, Bar)
    command?: Command;

    async execute() {
      await this.command?.execute();
    }
  }

  await assertSnapshot(t, new Root().help());
});
