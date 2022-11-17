import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.119.0/path/mod.ts";

const dir = dirname(fromFileUrl(import.meta.url));

async function embedCode(fname: string, typ = ""): Promise<string> {
  const script = await Deno.readTextFile(`${dir}/../${fname}`);
  return ["```" + typ, script.trim(), "```"].join("\n");
}

async function embedCommands(cmds: string[], sh = "bash"): Promise<string> {
  return [
    "```console",
    (await Promise.all(cmds.map((cmd) => _embedCommand(cmd, sh)))).join("\n\n"),
    "```",
  ].join("\n");
}

async function _embedCommand(cmd: string, sh = "bash"): Promise<string> {
  const p = Deno.run({
    cmd: [sh, "-c", `cd ${dir}/..; ${cmd}`],
    stderr: "piped",
    stdout: "piped",
  });

  const { code } = await p.status();
  if (code !== 0) {
    const rawError = await p.stderrOutput();
    const msg = new TextDecoder().decode(rawError);
    console.error(msg);
    throw new Error(`fail to command: ${cmd}`);
  } else {
    const rawOutput = await p.output();
    const result = new TextDecoder().decode(rawOutput);
    return `$ ${cmd}\n${result.trimEnd()}`;
  }
}

console.log(`
[![ci](https://github.com/stsysd/classopt/actions/workflows/ci.yml/badge.svg)](https://github.com/stsysd/classopt/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/stsysd/classopt/branch/main/graph/badge.svg?token=I7PRYZ3Z71)](https://codecov.io/gh/stsysd/classopt)

# classopt

_classopt_ is a command line arguments parser for deno based with decorators.

## Usage Example

${await embedCode("examples/basic.ts", "typescript")}

${await embedCommands([
  "deno run examples/basic.ts --help",
  "deno run examples/basic.ts -p pass --debug stsysd",
])}

### Options

${await embedCode("examples/opt.ts", "typescript")}

${await embedCommands(["deno run examples/opt.ts --help"])}

### Arguments

${await embedCode("examples/arg.ts", "typescript")}

${await embedCommands(["deno run examples/arg.ts --help"])}

### Sub Commands

${await embedCode("examples/cmd.ts", "typescript")}

${await embedCommands([
  "deno run examples/cmd.ts --help",
  "deno run examples/cmd.ts list --help",
  "deno run examples/cmd.ts get --help",
])}`.trimStart());
