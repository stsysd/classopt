export function kebabify(s: string): string {
  if (s.length === 0) return s;
  return (
    s[0].toLowerCase() +
    s
      .slice(1)
      .replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      .replaceAll("_", "-")
  );
}

export function camelify(s: string): string {
  return s.replaceAll(/-|_./g, (s) => s[1].toUpperCase());
}
