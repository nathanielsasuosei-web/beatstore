import { z } from "zod";
import { simulationAllowed } from "@/lib/paystack";
import { fulfilOrder } from "@/lib/fulfilment";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { getOrderByReference } from "@/lib/data/sales";

const schema = z.object({
  reference: z.string().min(3),
  channel: z.string().max(40).optional().nullable(),
});

/**
 * Demo-mode "payment gateway": instantly confirms an order so the whole
 * buy → pay → email-delivery flow can be tested without live keys.
 * Disabled automatically once a real Paystack key is configured.
 */
export const POST = apiHandler(async (request: Request) => {
  if (!simulationAllowed()) {
    return jsonError("Test payments are disabled on this store.", 403);
  }

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid request", 422);

  const order = getOrderByReference(parsed.data.reference);
  if (!order) return jsonError("Order not found", 404);
  if (order.status === "paid") return jsonOk({ alreadyPaid: true, reference: order.reference });

  const result = await fulfilOrder({
    orderId: order.id,
    paymentRef: `TEST-${order.reference}`,
    // keep the order's own payment method so the receipt reflects what was chosen
    channel: parsed.data.channel ?? null,
  });

  if (!result.ok) return jsonError("Could not complete the test payment", 500);
  return jsonOk({ reference: order.reference });
});
