import { bookingConfirmationEmail, bookingAdminEmail, bookingStatusEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, randomRef } from "@/lib/utils";
import { bookingsOnDate, getBookingById, updateBooking } from "@/lib/data/bookings";
import { BOOKING_SLOT_HOLDING_STATUSES } from "@/lib/constants";
import type { Booking } from "@/lib/data/types";
import {
  formatBookingDate,
  formatHour,
  formatHourLabel,
  hoursForDate,
  todayISO,
  type BookingQuote,
  type DayHours,
} from "@/lib/schedule";

export {
  formatBookingDate,
  formatHour,
  formatHourLabel,
  hoursForDate,
  openingHoursTable,
  parseHours,
  todayISO,
  quoteBooking,
} from "@/lib/schedule";
export type { BookingQuote, DayHours };

/* ── availability ──────────────────────────────────────────── */

export type SlotInfo = { hour: number; available: boolean };

/**
 * Start hours for a date, given opening hours and session length.
 * A slot fits when start + hours ≤ close, and doesn't overlap a held slot.
 */
export function slotsForDate({
  settings,
  dateISO,
  hours,
}: {
  settings: Record<string, string>;
  dateISO: string;
  hours: number;
}): { open: number; close: number; slots: SlotInfo[] } | null {
  const day = hoursForDate(settings, dateISO);
  if (!day) return null;

  const open = Math.ceil(day.open);
  const close = day.close;
  const slots: SlotInfo[] = [];

  const taken = bookingsOnDate(dateISO).map((b) => ({ start: b.startHour, end: b.endHour }));

  for (let hour = open; hour + hours <= close + 1e-9; hour += 1) {
    const overlaps = taken.some((t) => hour < t.end - 1e-9 && hour + hours > t.start + 1e-9);
    // Can't start a session in the past (today only — Ghana is UTC).
    const slotTime = new Date(`${dateISO}T${String(Math.floor(hour)).padStart(2, "0")}:00:00Z`).getTime();
    const inPast = dateISO === todayISO() && slotTime < Date.now();
    slots.push({ hour, available: !overlaps && !inPast });
  }

  return { open, close, slots };
}

export function slotAvailable({
  settings,
  dateISO,
  startHour,
  hours,
}: {
  settings: Record<string, string>;
  dateISO: string;
  startHour: number;
  hours: number;
}): { ok: true } | { ok: false; error: string } {
  if (dateISO < todayISO()) return { ok: false, error: "That date has already passed. Pick today or a future date." };

  const day = hoursForDate(settings, dateISO);
  if (!day) return { ok: false, error: "The studio is closed that day. Pick another date." };

  if (startHour < day.open || startHour + hours > day.close + 1e-9) {
    return {
      ok: false,
      error: `That doesn't fit the opening hours (${formatHourLabel(day.open, day.close)}). Pick another time.`,
    };
  }

  const slotTime = new Date(`${dateISO}T${String(Math.floor(startHour)).padStart(2, "0")}:00:00Z`).getTime();
  if (dateISO === todayISO() && slotTime < Date.now()) {
    return { ok: false, error: "That time has already passed today. Pick a later slot." };
  }

  const taken = bookingsOnDate(dateISO);
  for (const booking of taken) {
    if (startHour < booking.endHour - 1e-9 && startHour + hours > booking.startHour + 1e-9) {
      return {
        ok: false,
        error: `Sorry — ${formatHour(booking.startHour)} to ${formatHour(booking.endHour)} that day is already booked. Pick another slot.`,
      };
    }
  }

  return { ok: true };
}

/* ── lifecycle ─────────────────────────────────────────────── */

export type BookingEmailData = Booking & {
  dateLabel: string;
  timeLabel: string;
};

export function bookingEmailData(booking: Booking): BookingEmailData {
  return {
    ...booking,
    dateLabel: formatBookingDate(booking.date),
    timeLabel: `${formatHour(booking.startHour)} – ${formatHour(booking.endHour)}`,
  };
}

/**
 * Marks a booking as paid (deposit received) and emails the artist their
 * confirmation. Safe to call twice — an already-confirmed booking is returned
 * untouched, exactly like fulfilOrder.
 */
export async function confirmBooking({
  bookingId,
  paymentRef,
  channel,
}: {
  bookingId: string;
  paymentRef?: string | null;
  channel?: string | null;
}) {
  const booking = getBookingById(bookingId);
  if (!booking) return { ok: false as const, error: "Booking not found" };
  if (booking.status === "confirmed" || booking.status === "completed") {
    return { ok: true as const, alreadyDone: true, booking };
  }

  const settings = await getSettings();

  updateBooking(bookingId, {
    status: "confirmed",
    paidAt: Date.now(),
    paymentRef: paymentRef ?? booking.paymentRef,
    paymentMethod: channel ? normaliseChannel(channel) : booking.paymentMethod,
  });

  const updated = getBookingById(bookingId)!;
  const data = bookingEmailData(updated);

  const confirmation = bookingConfirmationEmail({
    booking: data,
    policy: settings.studio_policy,
    supportEmail: settings.support_email,
    producerName: settings.producer_name,
  });
  await sendEmail({
    to: updated.email,
    subject: confirmation.subject,
    html: confirmation.html,
    type: "booking-confirmed",
    replyTo: settings.support_email,
  });

  if (settings.support_email) {
    const admin = bookingAdminEmail({ booking: data });
    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
      subject: admin.subject,
      html: admin.html,
      type: "admin-booking",
    });
  }

  return { ok: true as const, alreadyDone: false, booking: updated };
}

export async function cancelBooking({ bookingId, note }: { bookingId: string; note?: string | null }) {
  const booking = getBookingById(bookingId);
  if (!booking) return { ok: false as const, error: "Booking not found" };
  if (booking.status === "cancelled") return { ok: true as const, alreadyDone: true, booking };
  if (booking.status === "completed") return { ok: false as const, error: "A completed session can't be cancelled." };

  const settings = await getSettings();
  updateBooking(bookingId, { status: "cancelled" });
  const updated = getBookingById(bookingId)!;

  const mail = bookingStatusEmail({
    booking: bookingEmailData(updated),
    status: "cancelled",
    note: note ?? null,
    supportEmail: settings.support_email,
  });
  await sendEmail({ to: updated.email, subject: mail.subject, html: mail.html, type: "booking-cancelled" });

  return { ok: true as const, alreadyDone: false, booking: updated };
}

/** Booking reference in the same family as order references: BKG-XXXXXX */
export function newBookingReference() {
  return randomRef("BKG");
}

export { BOOKING_SLOT_HOLDING_STATUSES };

/**
 * Guards against partial online payments — the deposit + fee must land.
 * 1 pesewa of tolerance covers rounding on the gateway.
 */
export function paidInFull(booking: Booking, amountMinor: number) {
  return amountMinor + 1 >= booking.amountDue;
}

function normaliseChannel(channel: string) {
  const map: Record<string, string> = {
    mobile_money: "paystack",
    card: "paystack",
    bank: "paystack",
    bank_transfer: "paystack",
    ussd: "paystack",
    eft: "paystack",
  };
  return map[channel] ?? channel;
}

export function bookingStatusUrl(reference: string) {
  return absoluteUrl(`/studio/confirmed/${reference}`);
}
