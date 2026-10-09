import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { cancelBooking, confirmBooking, bookingEmailData } from "@/lib/booking";
import { bookingConfirmationEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { deleteBooking, getBookingById, updateBooking } from "@/lib/data/bookings";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["confirm", "complete", "cancel", "resend_confirmation", "delete"]),
  note: z.string().max(300).optional().nullable(),
});

export const PATCH = apiHandler(async (request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid action", 422);

  const booking = getBookingById(id);
  if (!booking) return jsonError("Booking not found", 404);

  switch (parsed.data.action) {
    case "confirm": {
      // Producer verified the deposit (MoMo/bank claim or cash) — confirm + email.
      const result = await confirmBooking({ bookingId: id, paymentRef: booking.payerNote ?? "verified-by-producer" });
      if (!result.ok) return jsonError(result.error ?? "Could not confirm the booking", 500);
      return jsonOk({ status: result.booking?.status ?? "confirmed" });
    }
    case "complete": {
      if (booking.status !== "confirmed" && booking.status !== "completed") {
        return jsonError("Only confirmed sessions can be completed.", 409);
      }
      updateBooking(id, { status: "completed" });
      return jsonOk({ status: "completed" });
    }
    case "cancel": {
      const result = await cancelBooking({ bookingId: id, note: parsed.data.note ?? null });
      if (!result.ok) return jsonError(result.error ?? "Could not cancel", 400);
      return jsonOk({ status: "cancelled" });
    }
    case "resend_confirmation": {
      if (booking.status !== "confirmed" && booking.status !== "completed") {
        return jsonError("The deposit hasn't been confirmed yet.", 409);
      }
      const settings = await getSettings();
      const mail = bookingConfirmationEmail({
        booking: bookingEmailData(booking),
        policy: settings.studio_policy,
        supportEmail: settings.support_email,
        producerName: settings.producer_name,
      });
      await sendEmail({
        to: booking.email,
        subject: mail.subject,
        html: mail.html,
        type: "booking-confirmed",
        replyTo: settings.support_email,
      });
      return jsonOk({ resent: true });
    }
    case "delete": {
      deleteBooking(id);
      return jsonOk({ deleted: true });
    }
    default:
      return jsonError("Unsupported action", 422);
  }
});
