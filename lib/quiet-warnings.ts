/**
 * node:sqlite prints "SQLite is an experimental feature" on every process start,
 * which drowns out real logs in development. Filter just that one message —
 * every other warning still comes through untouched.
 */
type EmitWarning = typeof process.emitWarning;

const original = process.emitWarning.bind(process) as EmitWarning;

process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const message = typeof warning === "string" ? warning : warning?.message ?? "";
  if (message.includes("SQLite is an experimental feature")) return;
  return (original as (...args: unknown[]) => unknown)(warning, ...rest);
}) as EmitWarning;

export {};
