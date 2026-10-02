import "@/lib/quiet-warnings"; // must come before node:sqlite
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Thin data layer over Node's built-in SQLite (node:sqlite).
 *
 * Why not an ORM? So the project has zero native dependencies and runs
 * anywhere Node 22+ runs — no engine downloads, no build step. If you later
 * move to Postgres, this file plus lib/data/* are the only places that need
 * to change (see the note at the bottom).
 */

const globalForDb = globalThis as unknown as { __bsDb?: DatabaseSync; __bsSchemaReady?: boolean };

function dbFile(): string {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const cleaned = url.replace(/^file:/, "").replace(/^\/\//, "");
  const full = path.isAbsolute(cleaned) ? cleaned : path.join(process.cwd(), cleaned);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  return full;
}

function openDatabase(): DatabaseSync {
  if (globalForDb.__bsDb) return globalForDb.__bsDb;

  const db = new DatabaseSync(dbFile());
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");

  // Apply the schema on first use so a fresh clone just works.
  try {
    const schemaPath = path.join(process.cwd(), "lib", "sql", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      db.exec(fs.readFileSync(schemaPath, "utf8"));
    }
  } catch (error) {
    console.error("Could not apply schema.sql", error);
  }

  globalForDb.__bsDb = db;
  globalForDb.__bsSchemaReady = true;
  return db;
}

export function getDb(): DatabaseSync {
  return globalForDb.__bsDb ?? openDatabase();
}

/* ── tiny query helpers ─────────────────────────────────────── */

export type SqlValue = string | number | null | Uint8Array;

export function all<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | null {
  const row = getDb().prepare(sql).get(...params) as T | undefined;
  return row ?? null;
}

export function run(sql: string, params: SqlValue[] = []) {
  return getDb().prepare(sql).run(...params);
}

export function exec(sql: string) {
  getDb().exec(sql);
}

/** Runs fn inside a transaction, rolling back if it throws. */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function id(): string {
  return randomUUID().replace(/-/g, "").slice(0, 25);
}

export function now(): number {
  return Date.now();
}

/** Inserts a row from a plain object; keys become the column list. */
export function insert(table: string, values: Record<string, SqlValue>) {
  const keys = Object.keys(values);
  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`;
  run(sql, keys.map((k) => values[k]));
}

/** Updates a row by id with a plain object of columns. */
export function updateById(table: string, rowId: string, values: Record<string, SqlValue>) {
  const keys = Object.keys(values);
  if (!keys.length) return;
  const sql = `UPDATE ${table} SET ${keys.map((k) => `"${k}" = ?`).join(", ")} WHERE id = ?`;
  run(sql, [...keys.map((k) => values[k]), rowId]);
}

export function deleteById(table: string, rowId: string) {
  run(`DELETE FROM ${table} WHERE id = ?`, [rowId]);
}

export function count(table: string, where = "1=1", params: SqlValue[] = []) {
  const row = get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`, params);
  return row?.n ?? 0;
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const ms = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

export function dateOrNull(value: Date | null | undefined): number | null {
  return value ? value.getTime() : null;
}

/**
 * Moving to Postgres later: replace `openDatabase()` with a `pg.Pool` and the
 * four helpers below (all/get/run/tx) with their `pg` equivalents — every
 * query in lib/data/*.ts is plain SQL, so nothing else changes.
 */
