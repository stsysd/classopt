import { Arg, Command, Flag, Help, Name, Opt, Version } from "../mod.ts";

@Help("Help Text for Command")
@Name("program")
@Version("0.0.0")
class Program extends Command {
  @Arg({ about: "user to login" })
  username!: string;

  @Opt({ about: "password for user, if required", short: true })
  password = "";

  @Flag({ about: "debug mode" })
  debug = false;

  execute() {
    console.log(`<username> = ${JSON.stringify(this.username)}`);
    console.log(`-p, --password = ${JSON.stringify(this.password)}`);
    console.log(`--debug = ${JSON.stringify(this.debug)}`);
  }
}

await Program.run(Deno.args);
