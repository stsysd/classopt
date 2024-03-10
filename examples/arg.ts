import { Arg, Command, Help, Name, Version } from "../mod.ts";

@Help("example of how to use `Arg`")
@Name("program")
@Version("0.0.0")
class Program extends Command {
  @Arg({ about: "required argument" })
  req!: string;

  @Arg({ about: "`name` option is used in help", name: "named" })
  str = "";

  @Arg({ about: "optioanl argument", optional: true })
  opt?: string;

  // The order of arguments is determined by the order in which they are defined
  // So required arguments cannot be defined after optional arguments
  // @Arg({ about: "required argument after optional" })
  // invalid!: string;

  execute() {
    console.log(`<req> = ${this.req}`);
    console.log(`[opt] = ${this.opt}`);
    console.log(`<named> = ${this.str}`);
  }
}

await Program.run(Deno.args);
