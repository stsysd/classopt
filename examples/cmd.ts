import { Arg, Cmd, Command, Flag, Help, Name, Version } from "../mod.ts";

@Help("Help Text for 'list' Command")
class List extends Command {
  @Flag({ about: "Prints full path" })
  fullPath = false;

  execute() {
    console.log(`List.fullPath = ${this.fullPath}`);
  }
}

@Name("get")
@Help("Help Text for 'get' Command")
class GetCommand extends Command {
  @Arg({ about: "Specify path to get" })
  path!: string;

  execute() {
    console.log(`GetCommand.path = ${this.path}`);
  }
}

@Name("main")
@Version("0.0.0")
@Help("Help Text for Top Command")
class Program extends Command {
  @Cmd(List, GetCommand)
  command?: Command;

  execute() {
    if (this.command == null) {
      console.log(this.help());
    } else {
      this.command?.execute();
    }
  }
}

await Program.run(Deno.args);
