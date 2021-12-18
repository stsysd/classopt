import { Arg, Command, Flag, Help, Opt, Version } from "../mod.ts";

@Help("Help Text for Command")
@Version("0.0.0")
class Program extends Command {
  @Arg({ about: "user to login" })
  username = "";

  @Opt({ about: "password for user, if required", short: true })
  password = "";

  @Flag({ about: "debug mode" })
  debug = false;

  async execute() {
    console.log(`<username> = ${this.username}`);
    console.log(`-p, --password = ${this.password}`);
    console.log(`--debug = ${this.debug}`);
    await void 0; // requrie await
  }
}

await Program.run(Deno.args);
