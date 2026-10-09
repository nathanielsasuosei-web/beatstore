import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { bookingClaimedAdminEmail } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { bookingEmailData, formatBookingDate, formatHour } from "@/lib/booking";
import { getBookingByReference, updateBooking } from "@/lib/data/bookings";

const schema = z.object({
  payerNote: z.string().min(3, "Add the transaction ID or sender name").max(200),
  amountPaid: z.string().max(40).optional().nullable(),
  paidFrom: z.string().max(80).optional().nullable(),
});

type Params = { params: Promise<{ reference: string }> };

/**
 * Artist says "I've sent the mobile money / bank transfer" for a studio
 * deposit. The slot stays held; the producer verifies and confirms.
 */
export const POST = apiHandler(async (request: Request, { params }: Params) => {
  const { reference } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const booking = getBookingByReference(reference);
  if (!booking) return jsonError("We couldn't find that booking reference.", 404);
  if (booking.status === "confirmed" || booking.status === "completed") {
    return jsonError("This deposit is already confirmed — check your email.", 409);
  }
  if (booking.status === "cancelled") {
    return jsonError("This booking was cancelled. Book a new slot on the studio page.", 409);
  }

  const note = [
    parsed.data.payerNote,
    parsed.data.paidFrom ? `from ${parsed.data.paidFrom}` : null,
    parsed.data.amountPaid ? `amount ${parsed.data.amountPaid}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  updateBooking(booking.id, { status: "awaiting_verification", payerNote: note });

  const settings = await getSettings();
  const data = bookingEmailData(booking);

  const adminMail = bookingClaimedAdminEmail({
    booking: { ...data, notes: note },
  });
  await sendEmail({
    to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
    subject: adminMail.subject,
    html: adminMail.html,
    type: "admin-booking-claimed",
  });

  return jsonOk({
    reference: booking.reference,
    status: "awaiting_verification",
    session: `${formatBookingDate(booking.date)} · ${formatHour(booking.startHour)}`,
  });
});
