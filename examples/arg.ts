import { Arg, Command, Help, Version } from "../mod.ts";

@Help("example of how to use `Arg`")
@Version("0.0.0")
class Program extends Command {
  @Arg({ about: "required argument" })
  req!: string;

  @Arg({ about: "`name` option is used in help", name: "named" })
  str = "";

  @Arg({ about: "optioanl argument", optional: true })
  opt = "";

  // The order of arguments is determined by the order in which they are defined
  // So required arguments cannot be defined after optional arguments
  // @Arg({ about: "required argument after optional" })
  // invalid!: string;

  async execute() {
    console.log(`<req> = ${this.req}`);
    console.log(`[opt] = ${this.opt}`);
    console.log(`<named> = ${this.str}`);
    await void 0; // avoid `requrie-await`
  }
}

await Program.run(Deno.args);
