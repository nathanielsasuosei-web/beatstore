import { Resend } from "resend";
import { createEmailLog } from "@/lib/data/inbox";
import { siteUrl } from "@/lib/utils";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type: string;
  replyTo?: string;
  orderId?: string;
};

export type SendEmailResult = {
  ok: boolean;
  status: "sent" | "failed" | "preview";
  id?: string;
  error?: string;
  previewFrom: "resend" | "outbox";
};

function fromAddress() {
  return process.env.EMAIL_FROM || `Beatstore <onboarding@resend.dev>`;
}

export function emailMode(): "resend" | "outbox" {
  return process.env.RESEND_API_KEY ? "resend" : "outbox";
}

/**
 * Sends an email through Resend when RESEND_API_KEY is configured.
 * Without a key the message is still fully rendered and stored in the
 * EmailLog, so you can read every email in the admin Outbox.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = Array.isArray(input.to) ? input.to.filter(Boolean).join(",") : input.to;
  const text = input.text ?? stripHtml(input.html);

  if (!process.env.RESEND_API_KEY) {
    const log = await logEmail({
      ...input,
      to,
      text,
      status: "preview",
    });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email:outbox] "${input.subject}" → ${to}`);
    }
    return { ok: true, status: "preview", id: log?.id, previewFrom: "outbox" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: fromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text,
      replyTo: input.replyTo,
    });

    if (result.error) {
      await logEmail({ ...input, to, text, status: "failed", error: result.error.message });
      return { ok: false, status: "failed", error: result.error.message, previewFrom: "resend" };
    }

    const id = result.data?.id;
    await logEmail({ ...input, to, text, status: "sent", providerId: id });
    return { ok: true, status: "sent", id, previewFrom: "resend" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    await logEmail({ ...input, to, text, status: "failed", error: message });
    return { ok: false, status: "failed", error: message, previewFrom: "resend" };
  }
}

async function logEmail(input: {
  to: string;
  subject: string;
  type: string;
  html: string;
  text?: string;
  status: string;
  providerId?: string;
  error?: string;
  orderId?: string;
}) {
  try {
    return createEmailLog({
      to: input.to,
      from: fromAddress(),
      subject: input.subject,
      type: input.type,
      html: input.html,
      text: input.text,
      status: input.status,
      providerId: input.providerId,
      error: input.error,
      orderId: input.orderId,
    });
  } catch (error) {
    console.error("Failed to write email log", error);
    return null;
  }
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function emailShell({
  title,
  preheader,
  body,
  footerNote,
  cta,
}: {
  title: string;
  preheader?: string;
  body: string;
  footerNote?: string;
  cta?: { label: string; url: string };
}) {
  const base = siteUrl();
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#eeece3;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0a;padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#121110;border:1px solid #2c2b25;overflow:hidden;">
      <tr>
        <td style="padding:22px 28px;border-bottom:1px solid #2c2b25;">
          <p style="margin:0 0 6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#e23108;">${escapeHtml(title)}</p>
          <a href="${base}" style="color:#f6f4ee;text-decoration:none;font-size:17px;font-weight:800;letter-spacing:-0.3px;">
            <span style="display:inline-block;width:14px;height:14px;border:2px solid #e23108;vertical-align:-2px;margin-right:9px;"></span>${escapeHtml(base.replace(/^https?:\/\//, ""))}
          </a>
        </td>
      </tr>
      <tr><td style="padding:28px;font-size:15px;line-height:1.65;color:#d9d5c8;">${body}</td></tr>
      ${
        cta
          ? `<tr><td style="padding:0 28px 28px;">
        <a href="${cta.url}" style="display:inline-block;background:#e23108;color:#f6f4ee;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:13px 24px;font-size:13px;">${escapeHtml(
            cta.label
          )}</a>
      </td></tr>`
          : ""
      }
      <tr>
        <td style="padding:20px 28px;border-top:1px solid #2c2b25;color:#747166;font-size:12.5px;line-height:1.6;">
          ${footerNote ? `<p style="margin:0 0 10px;">${escapeHtml(footerNote)}</p>` : ""}
          <p style="margin:0;">You're receiving this because you bought beats or signed up at <a href="${base}" style="color:#e23108;">${escapeHtml(
            base.replace(/^https?:\/\//, "")
          )}</a>.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailButton(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;background:#e23108;color:#f6f4ee;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:12px 22px;font-size:13px;margin:6px 0;">${escapeHtml(
    label
  )}</a>`;
}

export function emailLines(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;background:#171614;border:1px solid #2c2b25;overflow:hidden;">
    ${rows
      .map(
        ([k, v], i) =>
          `<tr>
            <td style="padding:10px 16px;color:#918e80;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;${
              i > 0 ? "border-top:1px solid #2c2b25;" : ""
            }">${escapeHtml(k)}</td>
            <td style="padding:10px 16px;color:#f6f4ee;font-size:13px;text-align:right;font-weight:700;${
              i > 0 ? "border-top:1px solid #2c2b25;" : ""
            }">${escapeHtml(v)}</td>
          </tr>`
      )
      .join("")}
  </table>`;
}
