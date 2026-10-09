import { all, get, id, insert, now, run, toDate, updateById } from "@/lib/db";
import type { Booking, StudioService } from "@/lib/data/types";
import { BOOKING_SLOT_HOLDING_STATUSES } from "@/lib/constants";

type Row = Record<string, unknown>;

/* ── studio services ───────────────────────────────────────── */

export function mapService(row: Row): StudioService {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string) ?? null,
    pricePerHour: Number(row.pricePerHour ?? 0),
    minHours: Number(row.minHours ?? 1),
    maxHours: Number(row.maxHours ?? 8),
    active: Number(row.active ?? 1) === 1,
    sortOrder: Number(row.sortOrder ?? 0),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function listServices(activeOnly = false): StudioService[] {
  const rows = all<Row>(
    `SELECT * FROM studio_services ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sortOrder ASC, name ASC`
  );
  return rows.map(mapService);
}

export function getServiceById(serviceId: string): StudioService | null {
  const row = get<Row>("SELECT * FROM studio_services WHERE id = ?", [serviceId]);
  return row ? mapService(row) : null;
}

export function createService(values: {
  slug: string;
  name: string;
  description?: string | null;
  pricePerHour: number;
  minHours?: number;
  maxHours?: number;
  active?: boolean;
  sortOrder?: number;
}): StudioService {
  const serviceId = id();
  const ts = now();
  insert("studio_services", {
    id: serviceId,
    slug: values.slug,
    name: values.name,
    description: values.description ?? null,
    pricePerHour: values.pricePerHour,
    minHours: values.minHours ?? 1,
    maxHours: values.maxHours ?? 8,
    active: values.active === false ? 0 : 1,
    sortOrder: values.sortOrder ?? 0,
    createdAt: ts,
    updatedAt: ts,
  });
  return getServiceById(serviceId)!;
}

export function updateService(serviceId: string, values: Record<string, string | number | null>) {
  updateById("studio_services", serviceId, { ...values, updatedAt: now() });
  return getServiceById(serviceId);
}

export function deleteService(serviceId: string) {
  run("DELETE FROM studio_services WHERE id = ?", [serviceId]);
}

/* ── bookings ──────────────────────────────────────────────── */

export function mapBooking(row: Row): Booking {
  return {
    id: String(row.id),
    reference: String(row.reference),
    serviceId: (row.serviceId as string) ?? null,
    serviceName: String(row.serviceName ?? "Studio session"),
    userId: (row.userId as string) ?? null,
    email: String(row.email),
    name: String(row.name),
    phone: (row.phone as string) ?? null,
    date: String(row.date),
    startHour: Number(row.startHour ?? 0),
    hours: Number(row.hours ?? 1),
    endHour: Number(row.endHour ?? 0),
    pricePerHour: Number(row.pricePerHour ?? 0),
    sessionTotal: Number(row.sessionTotal ?? 0),
    depositPercent: Number(row.depositPercent ?? 50),
    depositAmount: Number(row.depositAmount ?? 0),
    serviceFeePercent: Number(row.serviceFeePercent ?? 0),
    serviceFeeAmount: Number(row.serviceFeeAmount ?? 0),
    amountDue: Number(row.amountDue ?? 0),
    balanceAmount: Number(row.balanceAmount ?? 0),
    currency: String(row.currency ?? "GHS"),
    notes: (row.notes as string) ?? null,
    status: String(row.status ?? "pending"),
    paymentMethod: String(row.paymentMethod ?? "paystack"),
    paymentRef: (row.paymentRef as string) ?? null,
    payerNote: (row.payerNote as string) ?? null,
    paidAt: toDate(row.paidAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function createBooking(values: {
  reference: string;
  serviceId: string | null;
  serviceName: string;
  userId?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  date: string;
  startHour: number;
  hours: number;
  endHour: number;
  pricePerHour: number;
  sessionTotal: number;
  depositPercent: number;
  depositAmount: number;
  serviceFeePercent: number;
  serviceFeeAmount: number;
  amountDue: number;
  balanceAmount: number;
  currency?: string;
  notes?: string | null;
  paymentMethod?: string;
}): Booking {
  const bookingId = id();
  const ts = now();
  insert("bookings", {
    id: bookingId,
    reference: values.reference,
    serviceId: values.serviceId,
    serviceName: values.serviceName,
    userId: values.userId ?? null,
    email: values.email.toLowerCase(),
    name: values.name,
    phone: values.phone ?? null,
    date: values.date,
    startHour: values.startHour,
    hours: values.hours,
    endHour: values.endHour,
    pricePerHour: values.pricePerHour,
    sessionTotal: values.sessionTotal,
    depositPercent: values.depositPercent,
    depositAmount: values.depositAmount,
    serviceFeePercent: values.serviceFeePercent,
    serviceFeeAmount: values.serviceFeeAmount,
    amountDue: values.amountDue,
    balanceAmount: values.balanceAmount,
    currency: values.currency ?? "GHS",
    notes: values.notes ?? null,
    status: "pending",
    paymentMethod: values.paymentMethod ?? "paystack",
    createdAt: ts,
    updatedAt: ts,
  });
  return getBookingById(bookingId)!;
}

export function getBookingById(bookingId: string): Booking | null {
  const row = get<Row>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  return row ? mapBooking(row) : null;
}

export function getBookingByReference(reference: string): Booking | null {
  const row = get<Row>("SELECT * FROM bookings WHERE upper(reference) = upper(?)", [reference.trim()]);
  return row ? mapBooking(row) : null;
}

export function getBookingByPaymentRef(paymentRef: string): Booking | null {
  const row = get<Row>("SELECT * FROM bookings WHERE paymentRef = ?", [paymentRef]);
  return row ? mapBooking(row) : null;
}

export function updateBooking(bookingId: string, values: Record<string, string | number | null>) {
  updateById("bookings", bookingId, { ...values, updatedAt: now() });
  return getBookingById(bookingId);
}

export function deleteBooking(bookingId: string) {
  run("DELETE FROM bookings WHERE id = ?", [bookingId]);
}

export type BookingFilter = { status?: string; email?: string; userId?: string; limit?: number };

export function listBookings(filter: BookingFilter = {}): Booking[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.status && filter.status !== "all") {
    where.push("status = ?");
    params.push(filter.status);
  }
  if (filter.email) {
    where.push("email = ?");
    params.push(filter.email.toLowerCase());
  }
  if (filter.userId) {
    where.push("userId = ?");
    params.push(filter.userId);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = all<Row>(
    `SELECT * FROM bookings ${whereSql} ORDER BY
       CASE WHEN status IN ('pending','awaiting_verification','confirmed') THEN 0 ELSE 1 END ASC,
       date ASC, startHour ASC, createdAt DESC
     LIMIT ?`,
    [...params, Math.min(filter.limit ?? 200, 500)]
  );
  return rows.map(mapBooking);
}

/** Bookings that hold studio time on a given date (YYYY-MM-DD). */
export function bookingsOnDate(date: string): Booking[] {
  const placeholders = BOOKING_SLOT_HOLDING_STATUSES.map(() => "?").join(", ");
  return all<Row>(
    `SELECT * FROM bookings WHERE date = ? AND status IN (${placeholders}) ORDER BY startHour ASC`,
    [date, ...BOOKING_SLOT_HOLDING_STATUSES]
  ).map(mapBooking);
}

export function upcomingBookings(limit = 6): Booking[] {
  const today = new Date().toISOString().slice(0, 10);
  return all<Row>(
    `SELECT * FROM bookings
     WHERE status IN ('pending','awaiting_verification','confirmed') AND date >= ?
     ORDER BY date ASC, startHour ASC LIMIT ?`,
    [today, limit]
  ).map(mapBooking);
}

export function bookingCounts() {
  const row = get<Row>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status IN ('pending','awaiting_verification') THEN 1 ELSE 0 END) AS todo,
       SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status IN ('confirmed','completed') THEN amountDue ELSE 0 END) AS deposits
     FROM bookings`
  );
  return {
    total: Number(row?.total ?? 0),
    todo: Number(row?.todo ?? 0),
    confirmed: Number(row?.confirmed ?? 0),
    completed: Number(row?.completed ?? 0),
    deposits: Number(row?.deposits ?? 0),
  };
}
