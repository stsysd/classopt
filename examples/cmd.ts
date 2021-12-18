import { Arg, Cmd, Command, Flag, Help, Name, Version } from "../mod.ts";

@Help("Help Text for 'list' Command")
class List extends Command {
  @Flag({ about: "Prints full path" })
  fullPath = false;

  async execute() {
    console.log(`List.fullPath = ${this.fullPath}`);
    await void 0; // avoid `requrie-await`
  }
}

@Name("get")
@Help("Help Text for 'get' Command")
class GetCommand extends Command {
  @Arg({ about: "Specify path to get" })
  path!: string;

  async execute() {
    console.log(`GetCommand.path = ${this.path}`);
    await void 0; // avoid `requrie-await`
  }
}

@Version("0.0.0")
@Help("Help Text for Top Command")
class Program extends Command {
  @Cmd(List, GetCommand)
  command?: Command;

  async execute() {
    if (this.command == null) {
      console.log(this.help());
    } else {
      this.command?.execute();
    }
    await void 0; // avoid `requrie-await`
  }
}

await Program.run(Deno.args);
