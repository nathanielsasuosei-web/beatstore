import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { sendEmail } from "@/lib/email";
import { replyEmail } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { createMessage, deleteMessage, getMessageById, updateMessage } from "@/lib/data/inbox";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["read", "archive", "new", "reply", "delete"]),
  replyBody: z.string().max(4000).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid action", 422);

  const message = getMessageById(id);
  if (!message) return jsonError("Message not found", 404);

  const settings = await getSettings();

  switch (parsed.data.action) {
    case "read":
      updateMessage(id, { status: "read" });
      return jsonOk({ status: "read" });

    case "new":
      updateMessage(id, { status: "new" });
      return jsonOk({ status: "new" });

    case "archive":
      updateMessage(id, { status: "archived" });
      return jsonOk({ status: "archived" });

    case "delete":
      deleteMessage(id);
      return jsonOk({ deleted: true });

    case "reply": {
      const body = parsed.data.replyBody?.trim();
      if (!body) return jsonError("Write a reply first", 422);

      const mail = replyEmail({ name: message.name, subject: message.subject, replyBody: body });
      const sent = await sendEmail({
        to: message.email,
        subject: mail.subject,
        html: mail.html,
        type: "admin-reply",
        replyTo: settings.support_email,
        orderId: message.orderId ?? undefined,
      });
      if (!sent.ok) return jsonError(sent.error ?? "The email could not be sent", 502);

      updateMessage(id, { status: "replied" });
      createMessage({
        userId: message.userId,
        orderId: message.orderId,
        name: settings.producer_name,
        email: settings.support_email,
        subject: message.subject,
        body,
        topic: message.topic,
        direction: "outbound",
        status: "replied",
      });

      return jsonOk({ status: "replied", delivered: sent.status });
    }

    default:
      return jsonError("Unsupported action", 422);
  }
}
