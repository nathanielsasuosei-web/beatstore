/**
 * Pure scheduling + pricing helpers, safe to import from client components.
 * Server-side slot logic lives in lib/booking.ts.
 */

export type DayHours = { open: number; close: number } | null;

const DAY_KEYS = ["hours_sun", "hours_mon", "hours_tue", "hours_wed", "hours_thu", "hours_fri", "hours_sat"] as const;

/** Parses "10:00-20:00" into {open:10, close:20}; "Closed"/empty → null. */
export function parseHours(raw: string | undefined | null): DayHours {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  const open = Number(match[1]) + (match[2] ? Number(match[2]) / 60 : 0);
  const close = Number(match[3]) + (match[4] ? Number(match[4]) / 60 : 0);
  if (close <= open || open < 0 || close > 24) return null;
  return { open, close };
}

/** Weekday index per JS Date (0 = Sunday). */
export function hoursForDate(settings: Record<string, string>, dateISO: string): DayHours {
  const date = new Date(`${dateISO}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return parseHours(settings[DAY_KEYS[date.getUTCDay()]]);
}

export function openingHoursTable(settings: Record<string, string>) {
  const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const order = [1, 2, 3, 4, 5, 6, 0]; // Monday first, like a studio schedule
  return order.map((day) => {
    const hours = parseHours(settings[DAY_KEYS[day]]);
    return { day: labels[day], label: hours ? formatHourLabel(hours.open, hours.close) : "Closed" };
  });
}

export function formatHourLabel(open: number, close: number) {
  return `${formatHour(open)} – ${formatHour(close)}`;
}

/** 9 → "9:00 AM", 14.5 → "2:30 PM" */
export function formatHour(hour: number) {
  const h24 = Math.floor(hour);
  const minutes = hour % 1 ? ":30" : "";
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}${minutes} ${period}`;
}

/** "2026-10-12" → "Mon 12 Oct 2026" */
export function formatBookingDate(dateISO: string) {
  const date = new Date(`${dateISO}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateISO;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today's date in the studio's timezone (Ghana = UTC, so UTC is exact). */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export type BookingQuote = {
  sessionTotal: number;
  depositPercent: number;
  depositAmount: number;
  serviceFeePercent: number;
  serviceFeeAmount: number;
  amountDue: number;
  balanceAmount: number;
};

/**
 * Prices a session entirely from stored numbers. The browser suggests hours;
 * the server decides money — same rule as the beat cart.
 */
export function quoteBooking({
  pricePerHour,
  hours,
  depositPercent,
  serviceFeePercent,
}: {
  pricePerHour: number;
  hours: number;
  depositPercent: number;
  serviceFeePercent: number;
}): BookingQuote {
  const sessionTotal = Math.round(pricePerHour * hours);
  const depositAmount = Math.round((sessionTotal * depositPercent) / 100);
  // The service fee applies to what's actually paid online now (the deposit),
  // mirroring meetbeatz' "transparent service fee shown before you pay".
  const serviceFeeAmount = Math.round((depositAmount * serviceFeePercent) / 100);
  const amountDue = depositAmount + serviceFeeAmount;
  return {
    sessionTotal,
    depositPercent,
    depositAmount,
    serviceFeePercent,
    serviceFeeAmount,
    amountDue,
    balanceAmount: sessionTotal - depositAmount,
  };
}
