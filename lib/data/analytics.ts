import { all, get } from "@/lib/db";

/**
 * Read-only reporting queries for the v12 dashboard.
 *
 * Everything is aggregated in SQLite rather than in JavaScript — the dashboard
 * is the one screen that has to stay quick as the store grows. Amounts stay in
 * minor units (pesewas) like the rest of the app.
 */

type Row = Record<string, unknown>;

export type SeriesPoint = { day: string; revenue: number; orders: number };
export type RangeKey = "7" | "30" | "90";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Paid revenue per day for the last `days`, gaps filled with zeroes. */
export function salesSeries(days: number): SeriesPoint[] {
  const since = Date.now() - (days - 1) * DAY_MS;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = all<Row>(
    `SELECT date(paidAt / 1000, 'unixepoch', 'localtime') AS day,
            COALESCE(SUM(total), 0) AS revenue,
            COUNT(*) AS orders
       FROM orders
      WHERE status = 'paid' AND paidAt >= ?
      GROUP BY day`,
    [since],
  );

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const row of rows) {
    byDay.set(String(row.day), {
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    });
  }

  const series: SeriesPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(startOfToday.getTime() - index * DAY_MS);
    const key = dayKey(date);
    const point = byDay.get(key);
    series.push({ day: key, revenue: point?.revenue ?? 0, orders: point?.orders ?? 0 });
  }
  return series;
}

/** All three ranges in one pass, so the range switcher is instant. */
export function salesRanges(): Record<RangeKey, SeriesPoint[]> {
  return { "7": salesSeries(7), "30": salesSeries(30), "90": salesSeries(90) };
}

export function rangeTotals(series: SeriesPoint[]) {
  const revenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const orders = series.reduce((sum, point) => sum + point.orders, 0);
  return { revenue, orders, average: orders ? Math.round(revenue / orders) : 0 };
}

/**
 * Change against the immediately preceding window of the same length —
 * `salesSeries` twice so the comparison is like for like.
 */
export function rangeDelta(days: number) {
  const current = rangeTotals(salesSeries(days));
  const previous = rangeTotals(
    // the previous window: shift the boundary back by `days`
    (() => {
      const shifted = salesSeries(days * 2).slice(0, days);
      return shifted;
    })(),
  );
  const percent =
    previous.revenue === 0
      ? current.revenue > 0
        ? 100
        : 0
      : Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100);
  return { current, previous, percent };
}

export type TierSlice = { tier: string; revenue: number; sales: number };

export function revenueByTier(): TierSlice[] {
  const rows = all<Row>(
    `SELECT oi.tier AS tier, COALESCE(SUM(oi.price), 0) AS revenue, COUNT(*) AS sales
       FROM order_items oi
       JOIN orders o ON o.id = oi.orderId
      WHERE o.status = 'paid'
      GROUP BY oi.tier
      ORDER BY revenue DESC`,
  );
  return rows.map((row) => ({
    tier: String(row.tier ?? "basic"),
    revenue: Number(row.revenue ?? 0),
    sales: Number(row.sales ?? 0),
  }));
}

export type PaymentSlice = { method: string; orders: number; total: number };

export function paymentMix(): PaymentSlice[] {
  const rows = all<Row>(
    `SELECT paymentMethod AS method, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS total
       FROM orders
      WHERE status IN ('paid', 'awaiting_verification')
      GROUP BY method
      ORDER BY total DESC`,
  );
  return rows.map((row) => ({
    method: String(row.method ?? "paystack"),
    orders: Number(row.orders ?? 0),
    total: Number(row.total ?? 0),
  }));
}

export type GenreRow = { genre: string; beats: number; plays: number; sales: number };

export function genrePerformance(limit = 6): GenreRow[] {
  const rows = all<Row>(
    `SELECT COALESCE(b.genre, 'Unfiled') AS genre,
            COUNT(DISTINCT b.id) AS beats,
            COALESCE(SUM(b.plays), 0) AS plays,
            (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.orderId
              WHERE o.status = 'paid' AND oi.beatId IN (SELECT id FROM beats WHERE genre IS b.genre)) AS sales
       FROM beats b
      GROUP BY b.genre
      ORDER BY plays DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    genre: String(row.genre),
    beats: Number(row.beats ?? 0),
    plays: Number(row.plays ?? 0),
    sales: Number(row.sales ?? 0),
  }));
}

export function downloadStats() {
  const row = get<{ total: number | null; week: number | null; used: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN lastDownloadAt >= ? THEN 1 ELSE 0 END) AS week,
            COALESCE(SUM(downloads), 0) AS used
       FROM downloads`,
    [Date.now() - 7 * DAY_MS],
  );
  const expiring = get<{ n: number | null }>(
    "SELECT COUNT(*) AS n FROM downloads WHERE expiresAt BETWEEN ? AND ?",
    [Date.now(), Date.now() + 3 * DAY_MS],
  );
  return {
    total: Number(row?.total ?? 0),
    activeThisWeek: Number(row?.week ?? 0),
    downloadsUsed: Number(row?.used ?? 0),
    expiringSoon: Number(expiring?.n ?? 0),
  };
}

export function storePulse() {
  const orders = get<{
    paid: number | null;
    pending: number | null;
    awaiting: number | null;
    failed: number | null;
    everything: number | null;
  }>(
    `SELECT
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'awaiting_verification' THEN 1 ELSE 0 END) AS awaiting,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       COUNT(*) AS everything
     FROM orders`,
  );

  const artists = get<{ total: number | null; week: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN createdAt >= ? THEN 1 ELSE 0 END) AS week
       FROM users WHERE role = 'artist'`,
    [Date.now() - 7 * DAY_MS],
  );

  const beats = get<{ total: number | null; published: number | null; plays: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) AS published,
            COALESCE(SUM(plays), 0) AS plays
       FROM beats`,
  );

  const messages = get<{ total: number | null; fresh: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh
       FROM messages WHERE direction = 'inbound'`,
  );

  const emails = get<{ total: number | null; sent: number | null; queued: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
            SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued
       FROM email_logs`,
  );

  const bookings = get<{ upcoming: number | null; todo: number | null }>(
    `SELECT
       SUM(CASE WHEN status = 'confirmed' AND date >= date('now', 'localtime') THEN 1 ELSE 0 END) AS upcoming,
       SUM(CASE WHEN status = 'awaiting_verification' THEN 1 ELSE 0 END) AS todo
     FROM bookings`,
  );

  return {
    orders: {
      paid: Number(orders?.paid ?? 0),
      pending: Number(orders?.pending ?? 0),
      awaiting: Number(orders?.awaiting ?? 0),
      failed: Number(orders?.failed ?? 0),
      total: Number(orders?.everything ?? 0),
    },
    artists: { total: Number(artists?.total ?? 0), newThisWeek: Number(artists?.week ?? 0) },
    beats: {
      total: Number(beats?.total ?? 0),
      published: Number(beats?.published ?? 0),
      plays: Number(beats?.plays ?? 0),
    },
    messages: { total: Number(messages?.total ?? 0), unread: Number(messages?.fresh ?? 0) },
    emails: {
      total: Number(emails?.total ?? 0),
      sent: Number(emails?.sent ?? 0),
      queued: Number(emails?.queued ?? 0),
    },
    bookings: { upcoming: Number(bookings?.upcoming ?? 0), toVerify: Number(bookings?.todo ?? 0) },
  };
}

/** Hour-of-day histogram of playing activity — "when your store sells". */
export function salesByWeekday(): { label: string; revenue: number; orders: number }[] {
  const rows = all<Row>(
    `SELECT CAST(strftime('%w', paidAt / 1000, 'unixepoch', 'localtime') AS INTEGER) AS dow,
            COALESCE(SUM(total), 0) AS revenue,
            COUNT(*) AS orders
       FROM orders
      WHERE status = 'paid' AND paidAt IS NOT NULL
      GROUP BY dow`,
  );
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const table = new Map<number, { revenue: number; orders: number }>();
  for (const row of rows) {
    table.set(Number(row.dow), {
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    });
  }
  return labels.map((label, index) => ({
    label,
    revenue: table.get(index)?.revenue ?? 0,
    orders: table.get(index)?.orders ?? 0,
  }));
}

/** Beat-level favourites, used for the "top of the crate" bar list. */
export function topBeatsByPlays(limit = 5) {
  const rows = all<Row>(
    `SELECT slug, title, coverImage, plays, genre FROM beats
      WHERE published = 1
      ORDER BY plays DESC LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    slug: (row.slug as string) ?? null,
    title: String(row.title ?? "Untitled"),
    coverImage: (row.coverImage as string) ?? null,
    genre: (row.genre as string) ?? null,
    plays: Number(row.plays ?? 0),
  }));
}
