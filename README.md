# classopt

command line arguments parser for deno based on decorators

## basic

```typescript
import { Arg, Command, Help, Opt, Version } from "./mod.ts";

@Help("Help Text for Command")
@Version("0.0.0")
class Program extends Command {
  @Arg({ about: "user to login" })
  username = "";

  @Arg({ about: "password for user, if required" })
  password = "";

  @Opt({ short: "d", about: "debug mode" })
  debug = false;

  execute() {
    console.log(`<username> = ${this.username}`);
    console.log(`[password] = ${this.password}`);
    console.log(`--debug = ${this.debug}`);
  }
}

await Program.run(Deno.args);
```

```
$ deno run -q example.ts --help
program - Help Text for Command

USAGE
    program [OPTIONS] <username> <password>

OPTIONS
    -d, --debug      debug mode
    -V, --version    Prints version information
    -h, --help       Prints help information

ARGS
    <username>    user to login
    <password>    password for user, if required

$ deno run -q example.ts -d ststysd pass
<username> = ststysd
[password] = pass
--debug = true
```

## subcommand

```typescript
import { Arg, Cmd, Command, Help, Name, Opt, Version } from "./mod.ts";

@Help("Help Text for 'list' Command")
class List extends Command {
  @Opt({ about: "Prints full path" })
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

@Name("program")
@Version("0.0.0")
@Help("Help Text for Root Command")
class Root extends Command {
  @Cmd(List, GetCommand)
  command?: Command;

  execute() {
    if (this.command == null) {
      console.log(this.help());
    } else {
      return this.command?.execute();
    }
  }
}

await Root.run(Deno.args);
```

```
$ deno run -q example.ts --help
program - Help Text for Root Command

USAGE
    program [OPTIONS]

OPTIONS
    -h, --help       Prints help information
    -V, --version    Prints version information

COMMANDS
    list    Help Text for 'list' Command
    get     Help Text for 'get' Command

$ deno run -q example.ts list --help
list - Help Text for 'list' Command

USAGE
    program list [OPTIONS]

OPTIONS
    -f, --full-path    Prints full path
    -h, --help         Prints help information


$ deno run -q example.ts get --help
get - Help Text for 'get' Command

USAGE
    program get [OPTIONS] <path>

OPTIONS
    -h, --help    Prints help information

ARGS
    <path>    Specify path to get
```
