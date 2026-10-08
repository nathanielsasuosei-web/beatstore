import { paystackEnabled, verifyWebhookSignature } from "@/lib/paystack";
import { fulfilOrder } from "@/lib/fulfilment";
import { getOrderByPaymentRef, getOrderByReference } from "@/lib/data/sales";
import { apiHandler } from "@/lib/http";

/**
 * Paystack webhook — the reliable path for confirming payment even if the
 * buyer closes the tab before the redirect back.
 * Configure this URL in the Paystack dashboard: https://your-domain/api/webhooks/paystack
 */
export const POST = apiHandler(async (request: Request) => {
  if (!paystackEnabled()) return new Response("Paystack not configured", { status: 503 });

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; status?: string; amount?: number; channel?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const reference = event.data.reference;
    const order = getOrderByReference(reference) ?? getOrderByPaymentRef(reference);
    if (order && order.status !== "paid") {
      await fulfilOrder({ orderId: order.id, paymentRef: reference, channel: event.data.channel ?? null });
    }
  }

  return Response.json({ received: true });
});
