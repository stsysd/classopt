import { Arg, Cmd, Command } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.114.0/testing/asserts.ts";

Deno.test("simple command", () => {
  let val;
  class Cmd extends Command {
    @Arg()
    arg = "";

    execute() {
      val = this.arg;
      return Promise.resolve();
    }
  }

  Cmd.run(["input"]);
  assertEquals(val, "input");
});

Deno.test("subcommands", async (suite) => {
  let val;

  class Foo extends Command {
    execute() {
      val = "foo";
      return Promise.resolve();
    }
  }

  class Bar extends Command {
    execute() {
      val = "bar";
      return Promise.resolve();
    }
  }

  class Root extends Command {
    @Cmd(Foo, Bar)
    command?: Command;

    async execute() {
      await this.command?.execute();
    }
  }

  await suite.step("execute", async () => {
    val = "";
    await Root.run(["foo"]);
    assertEquals(val, "foo");

    val = "";
    await Root.run(["bar"]);
    assertEquals(val, "bar");
  });
});
