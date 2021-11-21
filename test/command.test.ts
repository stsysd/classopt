import { Arg, Command, Cmd } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.114.0/testing/asserts.ts";

Deno.test("simple command", () => {
  let val;
  class Cmd extends Command {
    @Arg()
    arg = "";

    execute() {
      val = this.arg;
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
    }
  }

  class Bar extends Command {
    execute() {
      val = "bar";
    }
  }

  class Root extends Command {
    @Cmd(Foo, Bar)
    command?: Command;

    execute() {
      this.command?.execute();
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
