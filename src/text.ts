import { InternalError } from "./errors.ts";

type Indentation = {
  type: "indentation";
  values: TextBuilder[];
};

function indentation(...values: TextBuilder[]): Indentation {
  return {
    type: "indentation",
    values,
  };
}

type TextTable<T extends Record<string, string> = Record<string, string>> = {
  type: "TextTable";
  values: T[];
  headers: (keyof T)[];
};

function textTable<T extends Record<string, string>>(
  values: T[],
  headers: (keyof T)[]
): TextTable<T> {
  return {
    type: "TextTable",
    values,
    headers,
  };
}

type TextBuilder = Indentation | TextTable | string | TextBuilder[] | null;

const INDENT = " ".repeat(4);
const DELIMITER = " ".repeat(4);

function _buildText(builder: TextBuilder): string[] {
  if (builder == null) {
    return [];
  }
  if (typeof builder === "string") {
    return builder.split("\n");
  }
  if (Array.isArray(builder)) {
    return builder.flatMap((b) => _buildText(b));
  }
  if (builder.type === "indentation") {
    return builder.values.flatMap(_buildText).map((line) => INDENT + line);
  }
  if (builder.type === "TextTable") {
    const widths = Object.fromEntries(
      builder.headers.map((h) => [
        h,
        Math.max(...builder.values.map((v) => v[h].length)),
      ])
    );
    return builder.values.map((val) =>
      builder.headers
        .map((h, i) => {
          if (i === builder.headers.length - 1) {
            return val[h];
          } else {
            return val[h].padEnd(widths[h]);
          }
        })
        .join(DELIMITER)
    );
  }
  throw new InternalError("unreachable");
}

function buildText(...builder: TextBuilder[]): string {
  return _buildText(builder).join("\n");
}

export { buildText, indentation, textTable };
export type { TextBuilder };
