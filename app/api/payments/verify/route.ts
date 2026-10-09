import { verifyTransaction, paystackEnabled } from "@/lib/paystack";
import { fulfilOrder } from "@/lib/fulfilment";
import { confirmBooking, paidInFull } from "@/lib/booking";
import { absoluteUrl } from "@/lib/utils";
import { getOrderByPaymentRef, getOrderByReference, updateOrder } from "@/lib/data/sales";
import { getBookingByPaymentRef, getBookingByReference } from "@/lib/data/bookings";
import { apiHandler } from "@/lib/http";

/** Paystack redirects the buyer here after they finish paying. */
export const GET = apiHandler(async (request: Request) => {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");

  if (!reference) return Response.redirect(absoluteUrl("/checkout/failed?reason=missing-reference"), 302);
  if (!paystackEnabled()) return Response.redirect(absoluteUrl(`/checkout/pay/${reference}`), 302);

  const order = getOrderByReference(reference) ?? getOrderByPaymentRef(reference);
  if (!order) {
    // Studio bookings use the same Paystack flow with their own reference.
    const booking = getBookingByReference(reference) ?? getBookingByPaymentRef(reference);
    if (!booking) return Response.redirect(absoluteUrl("/checkout/failed?reason=unknown-order"), 302);

    if (booking.status === "confirmed" || booking.status === "completed") {
      return Response.redirect(absoluteUrl(`/studio/confirmed/${booking.reference}`), 302);
    }

    const result = await verifyTransaction(reference);
    if (!result.ok) {
      return Response.redirect(absoluteUrl(`/studio/pay/${booking.reference}?reason=verify`), 302);
    }

    if (result.status === "success" && paidInFull(booking, result.amountMinor)) {
      await confirmBooking({ bookingId: booking.id, paymentRef: reference, channel: result.channel });
      return Response.redirect(absoluteUrl(`/studio/confirmed/${booking.reference}`), 302);
    }

    return Response.redirect(absoluteUrl(`/studio/pay/${booking.reference}?reason=${result.status}`), 302);
  }

  if (order.status === "paid") {
    return Response.redirect(absoluteUrl(`/checkout/success/${order.reference}`), 302);
  }

  const result = await verifyTransaction(reference);
  if (!result.ok) {
    return Response.redirect(absoluteUrl(`/checkout/failed?ref=${order.reference}&reason=verify`), 302);
  }

  if (result.status === "success" && result.amountMinor >= order.total) {
    await fulfilOrder({ orderId: order.id, paymentRef: reference, channel: result.channel });
    return Response.redirect(absoluteUrl(`/checkout/success/${order.reference}`), 302);
  }

  updateOrder(order.id, { status: "failed", paymentRef: reference });
  return Response.redirect(absoluteUrl(`/checkout/failed?ref=${order.reference}&reason=${result.status}`), 302);
});
