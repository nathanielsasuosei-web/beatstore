import { z } from "zod";
import { initializeTransaction, paystackEnabled } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { absoluteUrl } from "@/lib/utils";
import { getOrderByReference, updateOrder } from "@/lib/data/sales";

const schema = z.object({ reference: z.string().min(3) });

/**
 * Re-opens the Paystack checkout for an existing unpaid order (e.g. the buyer
 * picked a manual transfer and changed their mind).
 */
export async function POST(request: Request) {
  if (!paystackEnabled()) return jsonError("Online payments are not configured on this store.", 503);

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid request", 422);

  const order = getOrderByReference(parsed.data.reference);
  if (!order) return jsonError("Order not found", 404);
  if (order.status === "paid") return jsonError("This order is already paid.", 409);

  const settings = await getSettings();

  const init = await initializeTransaction({
    email: order.email,
    amountMinor: order.total,
    currency: settings.currency || order.currency,
    reference: order.reference,
    callbackUrl: absoluteUrl("/api/payments/verify"),
    metadata: { orderId: order.id, orderRef: order.reference, retry: true },
  });

  if (!init.ok) return jsonError(init.error, 502);

  updateOrder(order.id, { paymentRef: init.reference, paymentMethod: "paystack" });
  return jsonOk({ redirect: init.authorizationUrl });
}
