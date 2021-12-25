# classopt

_classopt_ is a command line arguments parser for deno based with decorators.

## Usage Example

```typescript
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
```

```console
$ deno run examples/basic.ts --help
program - Help Text for Command

USAGE
    program [OPTIONS] <username>

OPTIONS
    -p, --password <string>    password for user, if required
    --debug                    debug mode
    -V, --version              Prints version information
    -h, --help                 Prints help information

ARGS
    <username>    user to login

$ deno run examples/basic.ts -p pass --debug stsysd
<username> = stsysd
-p, --password = pass
--debug = true
```

### Options

```typescript
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
```

```console
$ deno run examples/opt.ts --help
program - example of how to use `Opt`

USAGE
    program [OPTIONS]

OPTIONS
    --flag                   boolean option
    --str <string>           string option as default
    --num <number>           number option
    --multiple <string>      option that can be specified multiple times
    -s, --short1 <string>    enable short key
    -S, --short2 <string>    specify short key
    -L <string>              disable long key (need `short` option)
    --long-key <string>      specify long key
    -V, --version            Prints version information
    -h, --help               Prints help information
```

### Arguments

```typescript
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
```

```console
$ deno run examples/arg.ts --help
program - example of how to use `Arg`

USAGE
    program [OPTIONS] <req> <named> [opt]

OPTIONS
    -V, --version    Prints version information
    -h, --help       Prints help information

ARGS
    <req>      required argument
    <named>    `name` option is used in help
    [opt]      optioanl argument
```

### Sub Commands

```typescript
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
```

```console
$ deno run examples/cmd.ts --help
program - Help Text for Top Command

USAGE
    program [OPTIONS]

OPTIONS
    -h, --help       Prints help information
    -V, --version    Prints version information

COMMANDS
    list    Help Text for 'list' Command
    get     Help Text for 'get' Command

$ deno run examples/cmd.ts list --help
list - Help Text for 'list' Command

USAGE
    program list [OPTIONS]

OPTIONS
    --full-path    Prints full path
    -h, --help     Prints help information

$ deno run examples/cmd.ts get --help
get - Help Text for 'get' Command

USAGE
    program get [OPTIONS] <path>

OPTIONS
    -h, --help    Prints help information

ARGS
    <path>    Specify path to get
```
