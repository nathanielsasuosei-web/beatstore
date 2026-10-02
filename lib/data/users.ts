import { all, get, id, insert, now, run, updateById, toBool, toDate } from "@/lib/db";
import type { User } from "@/lib/data/types";

type Row = Record<string, unknown>;

export function mapUser(row: Row): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.passwordHash),
    role: String(row.role),
    phone: (row.phone as string) ?? null,
    country: (row.country as string) ?? null,
    stageName: (row.stageName as string) ?? null,
    emailVerified: toBool(row.emailVerified),
    verifyToken: (row.verifyToken as string) ?? null,
    resetToken: (row.resetToken as string) ?? null,
    resetExpires: toDate(row.resetExpires),
    lastLoginAt: toDate(row.lastLoginAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function getUserById(userId: string): User | null {
  const row = get<Row>("SELECT * FROM users WHERE id = ?", [userId]);
  return row ? mapUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const row = get<Row>("SELECT * FROM users WHERE lower(email) = lower(?)", [email.trim()]);
  return row ? mapUser(row) : null;
}

export function getUserByVerifyToken(token: string): User | null {
  const row = get<Row>("SELECT * FROM users WHERE verifyToken = ?", [token]);
  return row ? mapUser(row) : null;
}

export function getUserByResetToken(token: string): User | null {
  const row = get<Row>("SELECT * FROM users WHERE resetToken = ?", [token]);
  return row ? mapUser(row) : null;
}

export function createUser(values: {
  name: string;
  email: string;
  passwordHash: string;
  stageName?: string | null;
  phone?: string | null;
  country?: string | null;
  verifyToken?: string | null;
  role?: string;
}): User {
  const userId = id();
  const ts = now();
  insert("users", {
    id: userId,
    name: values.name,
    email: values.email.toLowerCase(),
    passwordHash: values.passwordHash,
    role: values.role ?? "artist",
    phone: values.phone ?? null,
    country: values.country ?? null,
    stageName: values.stageName ?? null,
    emailVerified: 0,
    verifyToken: values.verifyToken ?? null,
    createdAt: ts,
    updatedAt: ts,
  });
  return getUserById(userId)!;
}

export function updateUser(userId: string, values: Partial<Record<string, string | number | null>>) {
  updateById("users", userId, { ...values, updatedAt: now() });
  return getUserById(userId);
}

export function listUsers() {
  const rows = all<Row>(
    `SELECT u.*,
      (SELECT COUNT(*) FROM orders o WHERE o.userId = u.id) AS orderCount,
      (SELECT COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total ELSE 0 END), 0) FROM orders o WHERE o.userId = u.id) AS spend
     FROM users u ORDER BY u.createdAt DESC`
  );
  return rows.map((row) => ({
    ...mapUser(row),
    orderCount: Number(row.orderCount ?? 0),
    spend: Number(row.spend ?? 0),
  }));
}

export function deleteUser(userId: string) {
  run("DELETE FROM users WHERE id = ?", [userId]);
}
