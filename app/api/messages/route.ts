import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { contactAckEmail, customBeatAckEmail, newMessageAdminEmail } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { createMessage } from "@/lib/data/inbox";
import { getOrderByReference } from "@/lib/data/sales";

const schema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Add a subject").max(140),
  body: z.string().min(10, "Tell me a bit more").max(4000),
  topic: z.enum(["general", "custom-beat", "support", "order", "licence", "collab"]).default("general"),
  orderReference: z.string().max(40).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid message", 422);

  const { name, email, subject, body, topic, orderReference } = parsed.data;
  const user = await getCurrentUser();
  const settings = await getSettings();

  const order = orderReference ? getOrderByReference(orderReference) : null;

  const message = createMessage({
    userId: user?.id ?? null,
    orderId: order?.id ?? null,
    name,
    email,
    subject,
    body,
    topic,
    direction: "inbound",
    status: "new",
  });

  // Buyer gets an acknowledgement…
  const ack = topic === "custom-beat" ? customBeatAckEmail({ name }) : contactAckEmail({ name, subject, body });
  await sendEmail({
    to: message.email,
    subject: ack.subject,
    html: ack.html,
    type: "contact-ack",
    replyTo: settings.support_email,
  });

  // …and the producer gets the message plus a way to reply from the admin.
  const adminMail = newMessageAdminEmail({ name, email: message.email, subject, body, topic });
  await sendEmail({
    to: process.env.ADMIN_NOTIFICATION_EMAIL || settings.support_email,
    subject: adminMail.subject,
    html: adminMail.html,
    type: "admin-new-message",
    replyTo: message.email,
  });

  return jsonOk({ id: message.id }, 201);
}
