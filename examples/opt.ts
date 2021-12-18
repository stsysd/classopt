import { Command, Flag, Help, Opt, Version } from "../mod.ts";

@Help("example of how to use `Opt`")
@Version("0.0.0")
class Program extends Command {
  @Flag({ about: "boolean option" })
  flag = false;

  @Opt({ about: "string option as default" })
  str = "";

  @Opt({ about: "number option", type: "number" })
  num = 0;

  @Opt({
    about: "option that can be specified multiple times",
    type: "string",
    multiple: true,
  })
  multiple = [];

  @Opt({ about: "enable short key", short: true })
  short1 = "";

  @Opt({ about: "specify short key", short: "S" })
  short2 = "";

  @Opt({
    about: "disable long key (need `short` option)",
    long: false,
    short: "L",
  })
  long1 = "";

  @Opt({ about: "specify long key", long: "long-key" })
  long2 = "";

  async execute() {
    console.log(`--flag = ${this.flag}`);
    console.log(`--str = ${this.str}`);
    console.log(`--num = ${this.num}`);
    console.log(`--multiple = ${this.multiple}`);
    console.log(`-s, --short1 = ${this.short1}`);
    console.log(`-S, --short2 = ${this.short2}`);
    console.log(`-L = ${this.long1}`);
    console.log(`--long-key = ${this.long2}`);
    await void 0; // avoid `requrie-await`
  }
}

await Program.run(Deno.args);
