import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { paymentSubmittedAdminEmail, paymentSubmittedBuyerEmail } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { getOrderByReference, updateOrder } from "@/lib/data/sales";

const schema = z.object({
  reference: z.string().min(3),
  payerNote: z.string().min(3, "Add the transaction ID or sender name").max(200),
  amountPaid: z.string().max(40).optional().nullable(),
  paidFrom: z.string().max(80).optional().nullable(),
});

/**
 * Buyer says "I've sent the mobile money / bank transfer".
 * Order moves to awaiting_verification and the producer is emailed the details.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const order = getOrderByReference(parsed.data.reference);
  if (!order) return jsonError("We couldn't find that order reference.", 404);
  if (order.status === "paid") {
    return jsonError("This order is already paid — check your email for the download links.", 409);
  }

  const note = [
    parsed.data.payerNote,
    parsed.data.paidFrom ? `from ${parsed.data.paidFrom}` : null,
    parsed.data.amountPaid ? `amount ${parsed.data.amountPaid}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  updateOrder(order.id, { status: "awaiting_verification", payerNote: note });

  const settings = await getSettings();
  const summary = {
    reference: order.reference,
    name: order.name,
    email: order.email,
    total: order.total,
    currency: order.currency,
    status: "awaiting_verification",
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
  };

  const buyerMail = paymentSubmittedBuyerEmail({ order: summary, instructions: settings.pay_instructions });
  await sendEmail({
    to: order.email,
    subject: buyerMail.subject,
    html: buyerMail.html,
    type: "payment-submitted",
    orderId: order.id,
  });

  const adminMail = paymentSubmittedAdminEmail({ order: summary, payerNote: note });
  await sendEmail({
    to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
    subject: adminMail.subject,
    html: adminMail.html,
    type: "admin-payment-submitted",
    orderId: order.id,
  });

  return jsonOk({ reference: order.reference, status: "awaiting_verification" });
}
