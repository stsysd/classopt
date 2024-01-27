import * as errors from "./errors.ts";
import { buildText, indentation, TextBuilder, textTable } from "./text.ts";
import {
  ArgDescriptor,
  CommandDescriptor,
  getHelp,
  getName,
  getParent,
  metadata,
  OptDescriptor,
} from "./meta.ts";

function optTable(opts: OptDescriptor[]): TextBuilder {
  const vals = opts
    .map((desc) => {
      const { type, about, long, short } = desc;
      let usage = [short, long].filter(Boolean).join(", ");
      if (type !== "boolean") {
        usage = `${usage} <${type}>`;
      }
      return { usage, about: about ?? "" };
    });
  if (vals.length === 0) return null;
  return ["", "OPTIONS", indentation(textTable(vals, ["usage", "about"]))];
}

function argTable(args: ArgDescriptor[]): TextBuilder {
  const vals = args
    .map((desc) => {
      const { name, about, kind } = desc;
      let usage;
      if (kind === "required") {
        usage = `<${name || "input"}>`;
      } else if (kind === "optional") {
        usage = `[${name || "input"}]`;
      } else if (kind === "rest") {
        usage = `[${name || "input"}]...`;
      } else {
        throw new errors.InternalError("unreachable");
      }
      return { usage, about: about ?? "" };
    });

  if (vals.length === 0) return null;
  return ["", "ARGS", indentation(textTable(vals, ["usage", "about"]))];
}

function cmdTable(cmds: CommandDescriptor[]): TextBuilder {
  if (cmds.length === 0) return [];
  const vals = cmds.map((desc) => {
    const { command } = desc;
    return {
      usage: getName(command),
      about: getHelp(command) ?? "(NO HELP TEXT)",
    };
  });
  return ["", "COMMANDS", indentation(textTable(vals, ["usage", "about"]))];
}

function commandStack(cmd: object): string[] {
  let c = null;
  c = cmd.constructor;
  const names = [];
  while (c) {
    names.unshift(getName(c));
    c = getParent(c);
  }
  return names;
}

export function help<T extends object>(target: T): string {
  const meta = metadata(target);
  const name = getName(target.constructor);
  const help = getHelp(target.constructor);

  let usage = commandStack(target).join(" ");
  if (meta.opts.length > 0) {
    usage = `${usage} [OPTIONS]`;
  }
  if (meta.args) {
    for (const { name, kind } of meta.args) {
      if (kind === "required") {
        usage = `${usage} <${name || "input"}>`;
      } else if (kind === "optional") {
        usage = `${usage} [${name || "input"}]`;
      } else if (kind === "rest") {
        usage = `${usage} [${name || "input"}]...`;
      } else {
        throw new errors.InternalError("unreachable");
      }
    }
  } else if (meta.cmds) {
    usage = `${usage} <SUBCOMMAND>`;
  }

  return buildText(
    help ? `${name} - ${help}` : name,
    "",
    "USAGE",
    indentation(usage),
    optTable(meta.opts),
    meta.cmds && cmdTable(meta.cmds),
    meta.args && argTable(meta.args),
  );
}
