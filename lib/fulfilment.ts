import { createDownloadsForOrder, deliveryUrlForToken } from "@/lib/downloads";
import { sendEmail } from "@/lib/email";
import { orderDeliveryEmail, receiptEmail, type DeliveryItem } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatDate } from "@/lib/utils";
import { getBeatById, updateBeat } from "@/lib/data/catalog";
import { getOrderById, updateOrder } from "@/lib/data/sales";

/**
 * Marks an order as paid, issues download links, emails the buyer their beats
 * + receipt, and takes exclusive beats off the shelf.
 *
 * Safe to call twice (Paystack webhook + browser callback race): an order that
 * is already paid is returned untouched.
 */
export async function fulfilOrder({
  orderId,
  paymentRef,
  channel,
}: {
  orderId: string;
  paymentRef?: string | null;
  channel?: string | null;
}) {
  const order = getOrderById(orderId);
  if (!order) return { ok: false as const, error: "Order not found" };
  if (order.status === "paid") return { ok: true as const, alreadyDone: true, order };

  updateOrder(orderId, {
    status: "paid",
    paidAt: Date.now(),
    deliveredAt: Date.now(),
    paymentRef: paymentRef ?? order.paymentRef,
    paymentMethod: channel ? normaliseChannel(channel) : order.paymentMethod,
  });

  const updated = getOrderById(orderId)!;
  const downloads = createDownloadsForOrder(orderId, updated.userId);
  const settings = await getSettings();

  const deliveryItems: DeliveryItem[] = updated.items.map((item) => {
    const download = downloads.find((d) => d.orderItemId === item.id);
    const beat = item.beatId ? getBeatById(item.beatId) : null;
    return {
      title: item.title,
      licenseName: item.licenseName,
      tier: item.tier,
      fileFormat: item.fileFormat,
      downloadUrl: absoluteUrl(deliveryUrlForToken(download?.token ?? "")),
      licenseUrl: absoluteUrl(`/api/download/${download?.token ?? ""}/license`),
      previewUrl: beat?.previewFile ? absoluteUrl(beat.previewFile) : null,
    };
  });

  // Exclusive sales remove the beat from the storefront.
  for (const item of updated.items) {
    if (item.tier === "exclusive" && item.beatId) {
      updateBeat(item.beatId, { published: 0 });
    }
  }

  const summary = {
    reference: updated.reference,
    name: updated.name,
    email: updated.email,
    total: updated.total,
    currency: updated.currency,
    status: updated.status,
    createdAt: updated.createdAt,
    paidAt: updated.paidAt,
    paymentMethod: updated.paymentMethod,
    items: updated.items.map((i) => ({ title: i.title, licenseName: i.licenseName, price: i.price })),
  };

  const delivery = orderDeliveryEmail({
    order: summary,
    items: deliveryItems,
    supportEmail: settings.support_email,
  });

  await sendEmail({
    to: updated.email,
    subject: delivery.subject,
    html: delivery.html,
    type: "order-delivered",
    orderId: updated.id,
    replyTo: settings.support_email,
    text: `Your beats for order ${updated.reference} are ready. Sign in at ${absoluteUrl(
      "/account"
    )} to download them again any time. Paid ${formatDate(updated.paidAt ?? updated.createdAt, true)}.`,
  });

  const receipt = receiptEmail({ order: summary, supportEmail: settings.support_email });
  await sendEmail({
    to: updated.email,
    subject: receipt.subject,
    html: receipt.html,
    type: "receipt",
    orderId: updated.id,
  });

  return { ok: true as const, alreadyDone: false, order: updated, downloads };
}

function normaliseChannel(channel: string) {
  const c = channel.toLowerCase();
  if (c.includes("mobile_money") || c.includes("momo")) return "mobile_money";
  if (c.includes("bank")) return "bank_transfer";
  if (c.includes("card")) return "card";
  return c;
}

export function markOrderStatus(
  orderId: string,
  status: "pending" | "awaiting_verification" | "failed" | "cancelled" | "refunded",
  note?: string | null
) {
  return updateOrder(orderId, { status, ...(note ? { payerNote: note } : {}) });
}

/** Re-sends the delivery email with fresh links (used from the admin order view). */
export async function resendDeliveryEmail(orderId: string) {
  const order = getOrderById(orderId);
  if (!order) return { ok: false as const, error: "Order not found" };
  if (order.status !== "paid") return { ok: false as const, error: "Order is not paid yet" };

  // createDownloadsForOrder reuses any link that already exists
  const downloads = createDownloadsForOrder(orderId, order.userId);
  const settings = await getSettings();

  const items: DeliveryItem[] = order.items.map((item) => {
    const download = downloads.find((d) => d.orderItemId === item.id);
    const beat = item.beatId ? getBeatById(item.beatId) : null;
    return {
      title: item.title,
      licenseName: item.licenseName,
      tier: item.tier,
      fileFormat: item.fileFormat,
      downloadUrl: absoluteUrl(deliveryUrlForToken(download?.token ?? "")),
      licenseUrl: absoluteUrl(`/api/download/${download?.token ?? ""}/license`),
      previewUrl: beat?.previewFile ? absoluteUrl(beat.previewFile) : null,
    };
  });

  const mail = orderDeliveryEmail({
    order: {
      reference: order.reference,
      name: order.name,
      email: order.email,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ title: i.title, licenseName: i.licenseName, price: i.price })),
    },
    items,
    supportEmail: settings.support_email,
  });

  await sendEmail({
    to: order.email,
    subject: mail.subject,
    html: mail.html,
    type: "order-delivered-resend",
    orderId: order.id,
  });

  return { ok: true as const };
}
