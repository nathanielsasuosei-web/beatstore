import { z } from "zod";
import { createPendingOrder, resolveCart } from "@/lib/orders";
import { paystackEnabled, initializeTransaction } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { absoluteUrl } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { newOrderAdminEmail } from "@/lib/email-templates";
import { updateOrder } from "@/lib/data/sales";

const schema = z.object({
  items: z
    .array(z.object({ beatId: z.string().min(1), licenseId: z.string().min(1) }))
    .min(1, "Your cart is empty"),
  customer: z.object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().max(40).optional().nullable(),
    country: z.string().max(60).optional().nullable(),
  }),
  method: z.enum(["paystack", "mobile_money", "bank_transfer"]).default("paystack"),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid checkout details", 422);

  const { items, customer, method, note } = parsed.data;

  const { lines } = resolveCart(items);
  if (!lines.length) {
    return jsonError("Those beats are no longer available. Please refresh the store and try again.", 409);
  }

  const settings = await getSettings();
  const currency = settings.currency || "GHS";

  const order = createPendingOrder({ lines, customer, paymentMethod: method, note, currency });

  // Tell the producer a sale is in flight.
  if (settings.support_email) {
    const mail = newOrderAdminEmail({
      order: {
        reference: order.reference,
        name: order.name,
        email: order.email,
        total: order.total,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
      },
    });
    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
      subject: mail.subject,
      html: mail.html,
      type: "admin-new-order",
      orderId: order.id,
    });
  }

  const payUrl = `/checkout/pay/${order.reference}`;

  // ── Online payment (Paystack: mobile money / card / bank) ──
  if (method === "paystack") {
    if (paystackEnabled()) {
      const init = await initializeTransaction({
        email: order.email,
        amountMinor: order.total,
        currency,
        reference: order.reference,
        callbackUrl: absoluteUrl("/api/payments/verify"),
        metadata: {
          orderId: order.id,
          orderRef: order.reference,
          customer: order.name,
          items: lines.map((l) => `${l.beat.title} — ${l.license.name}`),
        },
      });

      if (init.ok) {
        updateOrder(order.id, { paymentRef: init.reference });
        return jsonOk({ orderId: order.id, reference: order.reference, redirect: init.authorizationUrl });
      }

      return jsonOk({
        orderId: order.id,
        reference: order.reference,
        redirect: payUrl,
        warning: init.error,
      });
    }

    // No live key configured → the built-in demo checkout.
    return jsonOk({
      orderId: order.id,
      reference: order.reference,
      redirect: `/checkout/test/${order.reference}`,
      mode: "test",
    });
  }

  // ── Manual transfer (MoMo / bank) ──
  return jsonOk({
    orderId: order.id,
    reference: order.reference,
    redirect: payUrl,
  });
}
