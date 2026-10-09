import { z } from "zod";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { paystackEnabled, initializeTransaction } from "@/lib/paystack";
import { absoluteUrl } from "@/lib/utils";
import {
  newBookingReference,
  quoteBooking,
  slotAvailable,
  bookingEmailData,
} from "@/lib/booking";
import {
  createBooking,
  getServiceById,
  listServices,
  updateBooking,
} from "@/lib/data/bookings";
import { sendEmail } from "@/lib/email";
import { bookingReceivedEmail, bookingAdminEmail } from "@/lib/email-templates";

const schema = z.object({
  serviceId: z.string().min(1, "Pick a studio service"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  hours: z.number().int().min(1).max(16),
  startHour: z.number().min(0).max(23.5),
  notes: z.string().max(600).optional().nullable(),
  customer: z.object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().max(40).optional().nullable(),
  }),
  method: z.enum(["paystack", "mobile_money", "bank_transfer"]).default("paystack"),
});

/** Creates a studio booking and returns where to pay the deposit. */
export const POST = apiHandler(async (request: Request) => {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid booking details", 422);

  const { serviceId, date, hours, startHour, notes, customer, method } = parsed.data;

  const service = getServiceById(serviceId);
  if (!service || !service.active) {
    return jsonError("That service is no longer offered. Pick another one.", 409);
  }
  if (hours < service.minHours || hours > service.maxHours) {
    return jsonError(`${service.name} runs ${service.minHours}–${service.maxHours} hours per session.`, 422);
  }

  const settings = await getSettings();
  const currency = settings.currency || "GHS";

  // Slot must exist, be open, and be free — decided entirely on the server.
  const slot = slotAvailable({ settings, dateISO: date, startHour, hours });
  if (!slot.ok) return jsonError(slot.error, 409);

  const depositPercent = Math.min(Math.max(Number(settings.studio_deposit_percent) || 50, 0), 100);
  const serviceFeePercent = Math.min(Math.max(Number(settings.studio_service_fee_percent) || 0, 0), 50);
  const quote = quoteBooking({
    pricePerHour: service.pricePerHour,
    hours,
    depositPercent,
    serviceFeePercent,
  });

  const user = await getCurrentUser();
  const booking = createBooking({
    reference: newBookingReference(),
    serviceId: service.id,
    serviceName: service.name,
    userId: user?.id ?? null,
    email: customer.email,
    name: customer.name,
    phone: customer.phone ?? null,
    date,
    startHour,
    hours,
    endHour: startHour + hours,
    pricePerHour: service.pricePerHour,
    sessionTotal: quote.sessionTotal,
    depositPercent: quote.depositPercent,
    depositAmount: quote.depositAmount,
    serviceFeePercent: quote.serviceFeePercent,
    serviceFeeAmount: quote.serviceFeeAmount,
    amountDue: quote.amountDue,
    balanceAmount: quote.balanceAmount,
    currency,
    notes: notes ?? null,
    paymentMethod: method,
  });

  const data = bookingEmailData(booking);

  // Manual (MoMo / bank) deposits arrive later — hold the slot and email the
  // payment instructions. Online payments get their receipt on confirmation.
  if (method !== "paystack") {
    const mail = bookingReceivedEmail({
      booking: data,
      payInstructions: settings.pay_instructions,
      supportEmail: settings.support_email,
    });
    await sendEmail({
      to: booking.email,
      subject: mail.subject,
      html: mail.html,
      type: "booking-instructions",
      replyTo: settings.support_email,
    });
  }

  if (settings.support_email) {
    const admin = bookingAdminEmail({ booking: { ...data, status: booking.status, paymentMethod: method } });
    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
      subject: admin.subject,
      html: admin.html,
      type: "admin-booking",
    });
  }

  // ── Online payment (Paystack: mobile money / card / bank) ──
  if (method === "paystack") {
    if (paystackEnabled()) {
      const init = await initializeTransaction({
        email: booking.email,
        amountMinor: booking.amountDue,
        currency,
        reference: booking.reference,
        callbackUrl: absoluteUrl("/api/payments/verify"),
        metadata: {
          bookingId: booking.id,
          bookingRef: booking.reference,
          customer: booking.name,
          items: [`${booking.serviceName} session deposit (${booking.date} ${booking.startHour}:00)`],
        },
      });

      if (init.ok) {
        updateBooking(booking.id, { paymentRef: init.reference });
        return jsonOk({ bookingId: booking.id, reference: booking.reference, redirect: init.authorizationUrl });
      }

      return jsonOk({
        bookingId: booking.id,
        reference: booking.reference,
        redirect: `/studio/pay/${booking.reference}`,
        warning: init.error,
      });
    }

    // No live key configured → the built-in demo checkout.
    return jsonOk({
      bookingId: booking.id,
      reference: booking.reference,
      redirect: `/studio/test/${booking.reference}`,
      mode: "test",
    });
  }

  // ── Manual transfer (MoMo / bank) ──
  return jsonOk({
    bookingId: booking.id,
    reference: booking.reference,
    redirect: `/studio/pay/${booking.reference}`,
  });
});

/** Services for the booking widget (kept here so the client never reads the DB). */
export const GET = apiHandler(async () => {
  const settings = await getSettings();
  const services = listServices(true);
  return jsonOk({
    services,
    depositPercent: Math.min(Math.max(Number(settings.studio_deposit_percent) || 50, 0), 100),
    serviceFeePercent: Math.min(Math.max(Number(settings.studio_service_fee_percent) || 0, 0), 50),
  });
});
