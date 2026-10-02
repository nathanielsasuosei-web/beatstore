import { emailButton, emailLines, emailShell, escapeHtml } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { absoluteUrl, formatDate } from "@/lib/utils";

export type DeliveryItem = {
  title: string;
  licenseName: string;
  tier: string;
  fileFormat?: string | null;
  downloadUrl: string;
  licenseUrl: string;
  previewUrl?: string | null;
};

export type OrderSummary = {
  reference: string;
  name: string;
  email: string;
  total: number;
  currency: string;
  status: string;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  paymentMethod: string;
  items?: { title: string; licenseName: string; price: number }[];
};

const SIGN = "— NSO Beats";

/* ── 1. Beat delivery (the email buyers wait for) ──────────── */

export function orderDeliveryEmail({
  order,
  items,
  supportEmail,
  downloadexpiresDays = 30,
}: {
  order: OrderSummary;
  items: DeliveryItem[];
  supportEmail: string;
  downloadexpiresDays?: number;
}) {
  const rows = items
    .map(
      (item) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #27272a;background:#18181b;border-radius:14px;margin:0 0 14px;">
        <tr><td style="padding:16px 18px 6px;color:#fafafa;font-size:16px;font-weight:700;">${escapeHtml(
          item.title
        )}</td></tr>
        <tr><td style="padding:0 18px 12px;color:#a1a1aa;font-size:13px;">${escapeHtml(
          item.licenseName
        )}${item.fileFormat ? ` · ${escapeHtml(item.fileFormat)}` : ""}</td></tr>
        <tr><td style="padding:0 18px 18px;">
          ${emailButton(item.downloadUrl, "Download beat")}
          ${item.previewUrl ? `<a href="${item.previewUrl}" style="color:#a3e635;font-size:13px;margin-left:10px;">Listen</a>` : ""}
          <div style="margin-top:10px;font-size:12.5px;color:#71717a;">
            <a href="${item.licenseUrl}" style="color:#71717a;text-decoration:underline;">Download licence agreement (PDF)</a>
          </div>
        </td></tr>
      </table>`
    )
    .join("");

  return {
    subject: `Your beats are ready — order ${order.reference}`,
    html: emailShell({
      title: "Your beats are ready 🎧",
      preheader: `${items.length} file${items.length === 1 ? "" : "s"} unlocked for order ${order.reference}`,
      body: `
        <p style="margin:0 0 14px;color:#fafafa;font-size:17px;font-weight:600;">Hey ${escapeHtml(
          order.name.split(" ")[0] || order.name
        )},</p>
        <p style="margin:0 0 8px;">Payment received and confirmed. Your licence${items.length === 1 ? "" : "s"} ${
        items.length === 1 ? "is" : "are"
      } below — click to download. The files are yours to keep, and these links also stay live in your artist dashboard.</p>
        ${rows}
        ${emailLines([
          ["Order reference", order.reference],
          ["Total paid", formatMoney(order.total, order.currency)],
          ["Date", formatDate(order.paidAt ?? order.createdAt, true)],
        ])}
        <p style="margin:0 0 8px;font-size:13.5px;color:#a1a1aa;">
          Each link works for ${downloadexpiresDays} days (up to 15 downloads). Got a problem? Just reply to this email and it comes straight to me.
        </p>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;">Work with me: send the track when it's done and I'll mix it free with any premium or exclusive licence.</p>
      `,
      cta: { label: "Open my dashboard", url: absoluteUrl("/account") },
      footerNote: `Need help? ${supportEmail}`,
    }),
  };
}

/* ── 2. Receipt ────────────────────────────────────────────── */

export function receiptEmail({ order, supportEmail }: { order: OrderSummary; supportEmail: string }) {
  const items = order.items ?? [];
  const body = `
    <p style="margin:0 0 12px;">Thanks for your payment — here's your receipt.</p>
    ${emailLines([
      ["Reference", order.reference],
      ...items.map((i) => [i.title, formatMoney(i.price, order.currency)] as [string, string]),
      ["Total", formatMoney(order.total, order.currency)],
      ["Paid with", order.paymentMethod],
      ["Status", order.status],
    ])}
    <p style="margin:0;font-size:13px;color:#a1a1aa;">Keep this email as your proof of purchase.</p>
  `;
  return {
    subject: `Receipt for ${order.reference}`,
    html: emailShell({
      title: "Payment receipt",
      preheader: `Receipt for order ${order.reference}`,
      body,
      footerNote: `Questions? ${supportEmail}`,
    }),
  };
}

/* ── 3. Manual payment submitted (buyer + admin) ──────────── */

export function paymentSubmittedBuyerEmail({
  order,
  instructions,
}: {
  order: OrderSummary;
  instructions: string;
}) {
  return {
    subject: `We're checking your payment — ${order.reference}`,
    html: emailShell({
      title: "Payment notice received",
      preheader: `Order ${order.reference} is being verified`,
      body: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(order.name.split(" ")[0] || order.name)}, we received your payment details for order <strong>${
        order.reference
      }</strong>.</p>
        <p style="margin:0 0 12px;">A human checks every mobile money and bank transfer, so this usually takes minutes but can take up to a few hours outside business hours. The moment it clears, your download links land in your inbox automatically.</p>
        <p style="margin:0;font-size:13.5px;color:#a1a1aa;">${escapeHtml(instructions)}</p>
      `,
    }),
  };
}

export function paymentSubmittedAdminEmail({
  order,
  payerNote,
}: {
  order: OrderSummary;
  payerNote?: string | null;
}) {
  return {
    subject: `💰 Payment submitted — ${order.reference} (${formatMoney(order.total, order.currency)})`,
    html: emailShell({
      title: "Payment to verify",
      preheader: `${order.name} submitted a payment for ${order.reference}`,
      body: `
        <p style="margin:0 0 12px;"><strong>${escapeHtml(order.name)}</strong> says they paid for order ${
        order.reference
      }.</p>
        ${emailLines([
          ["Amount", formatMoney(order.total, order.currency)],
          ["Method", order.paymentMethod],
          ["Transaction ref", payerNote || "—"],
          ["Buyer email", order.email],
        ])}
        <p style="margin:0 0 10px;">Open the admin orders page, check your MoMo/bank alert, then hit “Mark as paid” — the buyer is emailed the beat automatically.</p>
        ${emailButton(absoluteUrl("/admin/orders"), "Review in admin")}
      `,
    }),
  };
}

export function newOrderAdminEmail({ order }: { order: OrderSummary }) {
  return {
    subject: `🛒 New order started — ${order.reference}`,
    html: emailShell({
      title: "New order",
      preheader: `${order.name} started order ${order.reference}`,
      body: `
        <p style="margin:0 0 12px;">A new order was created on the store.</p>
        ${emailLines([
          ["Reference", order.reference],
          ["Customer", order.name],
          ["Email", order.email],
          ["Total", formatMoney(order.total, order.currency)],
          ["Method", order.paymentMethod],
          ["Status", order.status],
        ])}
        ${emailButton(absoluteUrl(`/admin/orders`), "View order")}
      `,
    }),
  };
}

/* ── 4. Account emails ────────────────────────────────────── */

export function welcomeEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return {
    subject: "Welcome to the store — confirm your email",
    html: emailShell({
      title: "Welcome 🎹",
      preheader: "One click to confirm your email",
      body: `
        <p style="margin:0 0 12px;">Hey ${escapeHtml(name.split(" ")[0] || name)}, welcome in.</p>
        <p style="margin:0 0 12px;">Your artist account is created. Confirm your email so we can deliver beats and receipts without a hitch:</p>
        ${emailButton(verifyUrl, "Confirm my email")}
        <p style="margin:14px 0 0;font-size:12.5px;color:#71717a;">Or paste this link: <span style="color:#a1a1aa;">${verifyUrl}</span></p>
      `,
    }),
  };
}

export function verifyEmailTemplate({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return {
    subject: "Confirm your email address",
    html: emailShell({
      title: "Confirm your email",
      preheader: "Confirm your email to keep your downloads safe",
      body: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name)}, tap the button below to confirm your email address.</p>
        ${emailButton(verifyUrl, "Confirm email")}
        <p style="margin:14px 0 0;font-size:12.5px;color:#71717a;">This link is valid for 7 days.</p>
      `,
    }),
  };
}

export function passwordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return {
    subject: "Reset your password",
    html: emailShell({
      title: "Reset your password",
      preheader: "Set a new password",
      body: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name)}, we got a request to reset your password.</p>
        ${emailButton(resetUrl, "Choose a new password")}
        <p style="margin:14px 0 0;font-size:12.5px;color:#a1a1aa;">The link expires in 1 hour. If you didn't ask for this, you can safely ignore this email — your password stays the same.</p>
      `,
    }),
  };
}

/* ── 5. Messages ──────────────────────────────────────────── */

export function contactAckEmail({ name, subject, body }: { name: string; subject: string; body: string }) {
  return {
    subject: `We got your message — ${subject}`,
    html: emailShell({
      title: "Message received",
      preheader: "We'll get back to you shortly",
      body: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name.split(" ")[0] || name)}, your message landed. Here's a copy:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;">
          <tr><td style="padding:16px 18px;color:#d4d4d8;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(
            body
          )}</td></tr>
        </table>
        <p style="margin:14px 0 0;">I reply to everything personally — usually within a day. Reply to this email if you need to add anything.</p>
      `,
    }),
  };
}

export function newMessageAdminEmail({
  name,
  email,
  subject,
  body,
  topic,
}: {
  name: string;
  email: string;
  subject: string;
  body: string;
  topic: string;
}) {
  return {
    subject: `✉️ New ${topic} message from ${name}`,
    html: emailShell({
      title: "New message",
      preheader: subject,
      body: `
        ${emailLines([
          ["From", `${name} <${email}>`],
          ["Topic", topic],
          ["Subject", subject],
        ])}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;">
          <tr><td style="padding:16px 18px;color:#d4d4d8;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(
            body
          )}</td></tr>
        </table>
        ${emailButton(absoluteUrl("/admin/messages"), "Reply from admin")}
      `,
    }),
  };
}

export function replyEmail({ name, subject, replyBody }: { name: string; subject: string; replyBody: string }) {
  return {
    subject: `Re: ${subject}`,
    html: emailShell({
      title: "Reply from NSO Beats",
      preheader: subject,
      body: `
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name.split(" ")[0] || name)},</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;">
          <tr><td style="padding:16px 18px;color:#d4d4d8;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(
            replyBody
          )}</td></tr>
        </table>
        <p style="margin:14px 0 0;color:#a1a1aa;font-size:13.5px;">Reply to this email to continue the conversation.</p>
      `,
    }),
  };
}

export function customBeatAckEmail({ name }: { name: string }) {
  return {
    subject: "Let's build your custom beat",
    html: emailShell({
      title: "Custom beat request",
      preheader: "Tell me more about the record",
      body: `
        <p style="margin:0 0 12px;">Thanks ${escapeHtml(name.split(" ")[0] || name)} — custom work is my favourite part of the job.</p>
        <p style="margin:0 0 12px;">To quote you properly, reply with: a reference track or two, the tempo/vibe, whether you need stems, and your deadline.</p>
        <p style="margin:0;">Typical turnaround is 3–5 days; rush delivery is available.</p>
      `,
    }),
  };
}

export function beatstoreSignature() {
  return SIGN;
}
