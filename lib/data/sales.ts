import { all, dateOrNull, get, id, insert, now, run, toDate, updateById } from "@/lib/db";
import type { Download, Order, OrderItem, OrderWithItems } from "@/lib/data/types";

type Row = Record<string, unknown>;

export function mapOrder(row: Row): Order {
  return {
    id: String(row.id),
    reference: String(row.reference),
    userId: (row.userId as string) ?? null,
    email: String(row.email),
    name: String(row.name),
    phone: (row.phone as string) ?? null,
    country: (row.country as string) ?? null,
    note: (row.note as string) ?? null,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? "GHS"),
    status: String(row.status ?? "pending"),
    paymentMethod: String(row.paymentMethod ?? "paystack"),
    paymentRef: (row.paymentRef as string) ?? null,
    payerNote: (row.payerNote as string) ?? null,
    paidAt: toDate(row.paidAt),
    deliveredAt: toDate(row.deliveredAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function mapOrderItem(row: Row): OrderItem {
  return {
    id: String(row.id),
    orderId: String(row.orderId),
    beatId: (row.beatId as string) ?? null,
    licenseId: (row.licenseId as string) ?? null,
    title: String(row.title),
    tier: String(row.tier),
    licenseName: String(row.licenseName),
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? "GHS"),
    fileFormat: (row.fileFormat as string) ?? null,
  };
}

export function mapDownload(row: Row): Download {
  return {
    id: String(row.id),
    token: String(row.token),
    orderId: String(row.orderId),
    orderItemId: String(row.orderItemId),
    userId: (row.userId as string) ?? null,
    fileUrl: (row.fileUrl as string) ?? null,
    licenseUrl: (row.licenseUrl as string) ?? null,
    downloads: Number(row.downloads ?? 0),
    maxDownloads: Number(row.maxDownloads ?? 15),
    expiresAt: toDate(row.expiresAt) ?? new Date(),
    lastDownloadAt: toDate(row.lastDownloadAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
  };
}

/* ── orders ────────────────────────────────────────────────── */

export function createOrder(values: {
  reference: string;
  userId?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  country?: string | null;
  note?: string | null;
  subtotal: number;
  total: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
}) {
  const orderId = id();
  const ts = now();
  insert("orders", {
    id: orderId,
    reference: values.reference,
    userId: values.userId ?? null,
    email: values.email.toLowerCase(),
    name: values.name,
    phone: values.phone ?? null,
    country: values.country ?? null,
    note: values.note ?? null,
    subtotal: values.subtotal,
    total: values.total,
    currency: values.currency ?? "GHS",
    status: values.status ?? "pending",
    paymentMethod: values.paymentMethod ?? "paystack",
    createdAt: ts,
    updatedAt: ts,
  });
  return getOrderById(orderId)!;
}

export function createOrderItem(values: {
  orderId: string;
  beatId?: string | null;
  licenseId?: string | null;
  title: string;
  tier: string;
  licenseName: string;
  price: number;
  currency?: string;
  fileFormat?: string | null;
}) {
  const itemId = id();
  insert("order_items", {
    id: itemId,
    orderId: values.orderId,
    beatId: values.beatId ?? null,
    licenseId: values.licenseId ?? null,
    title: values.title,
    tier: values.tier,
    licenseName: values.licenseName,
    price: values.price,
    currency: values.currency ?? "GHS",
    fileFormat: values.fileFormat ?? null,
  });
  return itemId;
}

export function orderItems(orderId: string): OrderItem[] {
  return all<Row>("SELECT * FROM order_items WHERE orderId = ?", [orderId]).map(mapOrderItem);
}

export function getOrderById(orderId: string): OrderWithItems | null {
  const row = get<Row>("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!row) return null;
  return { ...mapOrder(row), items: orderItems(orderId) };
}

export function getOrderByReference(reference: string): OrderWithItems | null {
  const row = get<Row>("SELECT * FROM orders WHERE upper(reference) = upper(?)", [reference.trim()]);
  if (!row) return null;
  return { ...mapOrder(row), items: orderItems(String(row.id)) };
}

export function getOrderByPaymentRef(paymentRef: string): OrderWithItems | null {
  const row = get<Row>("SELECT * FROM orders WHERE paymentRef = ?", [paymentRef]);
  if (!row) return null;
  return { ...mapOrder(row), items: orderItems(String(row.id)) };
}

export function updateOrder(orderId: string, values: Record<string, string | number | null>) {
  updateById("orders", orderId, { ...values, updatedAt: now() });
  return getOrderById(orderId);
}

export function deleteOrder(orderId: string) {
  run("DELETE FROM orders WHERE id = ?", [orderId]);
}

export function listOrders(options: { status?: string; q?: string; page?: number; limit?: number } = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  }
  if (options.q) {
    where.push("(reference LIKE ? OR email LIKE ? OR name LIKE ?)");
    const like = `%${options.q}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? where.join(" AND ") : "1=1";
  const limit = Math.min(options.limit ?? 40, 200);
  const page = Math.max(options.page ?? 1, 1);

  const rows = all<Row>(
    `SELECT * FROM orders WHERE ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  const totalRow = get<{ n: number }>(`SELECT COUNT(*) AS n FROM orders WHERE ${whereSql}`, params);

  // attach items (and licence/download info the admin needs at a glance)
  const orders: (OrderWithItems & { beatTitles: string[] })[] = rows.map((row) => {
    const items = orderItems(String(row.id));
    return { ...mapOrder(row), items, beatTitles: items.map((i) => i.title) };
  });

  return { orders, total: totalRow?.n ?? 0, page, pages: Math.max(1, Math.ceil((totalRow?.n ?? 0) / limit)) };
}

export function ordersForUser(user: { id: string; email: string }) {
  const rows = all<Row>(
    "SELECT * FROM orders WHERE userId = ? OR lower(email) = lower(?) ORDER BY createdAt DESC LIMIT 100",
    [user.id, user.email]
  );
  return rows.map((row) => ({ ...mapOrder(row), items: orderItems(String(row.id)) }));
}

export function ordersUsingBeat(beatId: string) {
  const row = get<{ n: number }>("SELECT COUNT(*) AS n FROM order_items WHERE beatId = ?", [beatId]);
  return row?.n ?? 0;
}

/* ── downloads ─────────────────────────────────────────────── */

export function createDownloadRecord(values: {
  token: string;
  orderId: string;
  orderItemId: string;
  userId?: string | null;
  fileUrl?: string | null;
  licenseUrl?: string | null;
  maxDownloads: number;
  expiresAt: Date;
}) {
  const downloadId = id();
  insert("downloads", {
    id: downloadId,
    token: values.token,
    orderId: values.orderId,
    orderItemId: values.orderItemId,
    userId: values.userId ?? null,
    fileUrl: values.fileUrl ?? null,
    licenseUrl: values.licenseUrl ?? null,
    downloads: 0,
    maxDownloads: values.maxDownloads,
    expiresAt: dateOrNull(values.expiresAt)!,
    createdAt: now(),
  });
  return getDownloadById(downloadId)!;
}

export function getDownloadById(downloadId: string): Download | null {
  const row = get<Row>("SELECT * FROM downloads WHERE id = ?", [downloadId]);
  return row ? mapDownload(row) : null;
}

export function getDownloadByToken(token: string): Download | null {
  const row = get<Row>("SELECT * FROM downloads WHERE token = ?", [token]);
  return row ? mapDownload(row) : null;
}

export function downloadForItem(orderItemId: string): Download | null {
  const row = get<Row>("SELECT * FROM downloads WHERE orderItemId = ?", [orderItemId]);
  return row ? mapDownload(row) : null;
}

export function downloadsForOrder(orderId: string): Download[] {
  return all<Row>("SELECT * FROM downloads WHERE orderId = ?", [orderId]).map(mapDownload);
}

export function registerDownload(downloadId: string) {
  run("UPDATE downloads SET downloads = downloads + 1, lastDownloadAt = ? WHERE id = ?", [now(), downloadId]);
}

/* ── reporting ─────────────────────────────────────────────── */

export function salesStats() {
  const row = get<{ revenue: number | null; paid: number | null; pending: number | null; awaiting: number | null }>(
    `SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS revenue,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'awaiting_verification' THEN 1 ELSE 0 END) AS awaiting
     FROM orders`
  );

  const topBeats = all<Row>(
    `SELECT b.slug, b.title, b.coverImage, COUNT(oi.id) AS sales, COALESCE(SUM(oi.price), 0) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.orderId
     LEFT JOIN beats b ON b.id = oi.beatId
     WHERE o.status = 'paid'
     GROUP BY oi.beatId, b.slug, b.title, b.coverImage
     ORDER BY sales DESC LIMIT 5`
  );

  const recent = all<Row>("SELECT * FROM orders WHERE status = 'paid' ORDER BY paidAt DESC LIMIT 6").map(mapOrder);

  const perDay = all<Row>(
    `SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders
     WHERE status = 'paid' AND paidAt >= ?`,
    [now() - 7 * 24 * 60 * 60 * 1000]
  );

  return {
    revenue: Number(row?.revenue ?? 0),
    paidOrders: Number(row?.paid ?? 0),
    pendingOrders: Number(row?.pending ?? 0),
    awaitingOrders: Number(row?.awaiting ?? 0),
    topBeats: topBeats.map((r) => ({
      slug: (r.slug as string) ?? null,
      title: (r.title as string) ?? "Removed beat",
      coverImage: (r.coverImage as string) ?? null,
      sales: Number(r.sales ?? 0),
      revenue: Number(r.revenue ?? 0),
    })),
    recent,
    weekRevenue: Number(perDay[0]?.revenue ?? 0),
    weekOrders: Number(perDay[0]?.orders ?? 0),
  };
}
