import { all, get, id, insert, now, run, toDate, updateById } from "@/lib/db";
import type { EmailLog, Message } from "@/lib/data/types";

type Row = Record<string, unknown>;

/* ── messages ──────────────────────────────────────────────── */

export function mapMessage(row: Row): Message {
  return {
    id: String(row.id),
    userId: (row.userId as string) ?? null,
    orderId: (row.orderId as string) ?? null,
    name: String(row.name),
    email: String(row.email),
    subject: String(row.subject),
    body: String(row.body),
    topic: String(row.topic ?? "general"),
    direction: String(row.direction ?? "inbound"),
    status: String(row.status ?? "new"),
    createdAt: toDate(row.createdAt) ?? new Date(),
  };
}

export function createMessage(values: {
  userId?: string | null;
  orderId?: string | null;
  name: string;
  email: string;
  subject: string;
  body: string;
  topic?: string;
  direction?: string;
  status?: string;
}) {
  const messageId = id();
  insert("messages", {
    id: messageId,
    userId: values.userId ?? null,
    orderId: values.orderId ?? null,
    name: values.name,
    email: values.email.toLowerCase(),
    subject: values.subject,
    body: values.body,
    topic: values.topic ?? "general",
    direction: values.direction ?? "inbound",
    status: values.status ?? "new",
    createdAt: now(),
  });
  return getMessageById(messageId)!;
}

export function getMessageById(messageId: string): Message | null {
  const row = get<Row>("SELECT * FROM messages WHERE id = ?", [messageId]);
  return row ? mapMessage(row) : null;
}

export function listMessages(options: { status?: string; q?: string; page?: number; limit?: number } = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  }
  if (options.q) {
    where.push("(name LIKE ? OR email LIKE ? OR subject LIKE ? OR body LIKE ?)");
    const like = `%${options.q}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? where.join(" AND ") : "1=1";
  const limit = Math.min(options.limit ?? 40, 200);
  const page = Math.max(options.page ?? 1, 1);

  const rows = all<Row>(
    `SELECT * FROM messages WHERE ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  const totalRow = get<{ n: number }>(`SELECT COUNT(*) AS n FROM messages WHERE ${whereSql}`, params);
  return { messages: rows.map(mapMessage), total: totalRow?.n ?? 0, page };
}

export function messagesForUser(user: { id: string; email: string }) {
  return all<Row>("SELECT * FROM messages WHERE userId = ? OR lower(email) = lower(?) ORDER BY createdAt DESC LIMIT 60", [
    user.id,
    user.email,
  ]).map(mapMessage);
}

export function updateMessage(messageId: string, values: Record<string, string | number | null>) {
  updateById("messages", messageId, values);
  return getMessageById(messageId);
}

export function deleteMessage(messageId: string) {
  run("DELETE FROM messages WHERE id = ?", [messageId]);
}

export function messageCounts() {
  return {
    new: get<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE status = 'new'")?.n ?? 0,
    total: get<{ n: number }>("SELECT COUNT(*) AS n FROM messages")?.n ?? 0,
  };
}

/* ── email log ─────────────────────────────────────────────── */

export function mapEmailLog(row: Row): EmailLog {
  return {
    id: String(row.id),
    to: String(row.to),
    from: (row.from as string) ?? null,
    subject: String(row.subject),
    type: String(row.type),
    html: (row.html as string) ?? null,
    text: (row.text as string) ?? null,
    status: String(row.status),
    providerId: (row.providerId as string) ?? null,
    error: (row.error as string) ?? null,
    orderId: (row.orderId as string) ?? null,
    createdAt: toDate(row.createdAt) ?? new Date(),
  };
}

export function createEmailLog(values: {
  to: string;
  from?: string | null;
  subject: string;
  type: string;
  html?: string | null;
  text?: string | null;
  status: string;
  providerId?: string | null;
  error?: string | null;
  orderId?: string | null;
}) {
  const logId = id();
  insert("email_logs", {
    id: logId,
    to: values.to,
    from: values.from ?? null,
    subject: values.subject,
    type: values.type,
    html: values.html ?? null,
    text: values.text ?? null,
    status: values.status,
    providerId: values.providerId ?? null,
    error: values.error ?? null,
    orderId: values.orderId ?? null,
    createdAt: now(),
  });
  return getEmailLogById(logId)!;
}

export function getEmailLogById(logId: string): EmailLog | null {
  const row = get<Row>("SELECT * FROM email_logs WHERE id = ?", [logId]);
  return row ? mapEmailLog(row) : null;
}

export function listEmailLogs(options: { status?: string; q?: string; limit?: number } = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  }
  if (options.q) {
    where.push('("to" LIKE ? OR subject LIKE ?)');
    const like = `%${options.q}%`;
    params.push(like, like);
  }
  const whereSql = where.length ? where.join(" AND ") : "1=1";
  const rows = all<Row>(
    `SELECT * FROM email_logs WHERE ${whereSql} ORDER BY createdAt DESC LIMIT ?`,
    [...params, Math.min(options.limit ?? 60, 200)]
  );
  return rows.map(mapEmailLog);
}

export function emailLogStats() {
  return {
    sent: get<{ n: number }>("SELECT COUNT(*) AS n FROM email_logs WHERE status = 'sent'")?.n ?? 0,
    preview: get<{ n: number }>("SELECT COUNT(*) AS n FROM email_logs WHERE status = 'preview'")?.n ?? 0,
    failed: get<{ n: number }>("SELECT COUNT(*) AS n FROM email_logs WHERE status = 'failed'")?.n ?? 0,
  };
}

/* ── settings ──────────────────────────────────────────────── */

export function readSettingRows(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function writeSettingRows(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    run(
      `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
      [key, String(value ?? ""), now()]
    );
  }
}
