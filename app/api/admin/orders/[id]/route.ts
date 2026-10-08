import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { fulfilOrder, markOrderStatus, resendDeliveryEmail } from "@/lib/fulfilment";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { deleteOrder, getOrderById } from "@/lib/data/sales";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["mark_paid", "set_status", "resend_delivery", "delete"]),
  status: z.enum(["pending", "awaiting_verification", "failed", "cancelled", "refunded"]).optional(),
  note: z.string().max(300).optional().nullable(),
});

export const PATCH = apiHandler(async (request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid action", 422);

  const order = getOrderById(id);
  if (!order) return jsonError("Order not found", 404);

  switch (parsed.data.action) {
    case "mark_paid": {
      const result = await fulfilOrder({ orderId: id, paymentRef: order.payerNote ?? undefined });
      if (!result.ok) return jsonError(result.error ?? "Could not mark as paid", 500);
      return jsonOk({ status: "paid", emailSent: true });
    }
    case "set_status": {
      if (!parsed.data.status) return jsonError("Choose a status", 422);
      markOrderStatus(id, parsed.data.status, parsed.data.note ?? null);
      return jsonOk({ status: parsed.data.status });
    }
    case "resend_delivery": {
      const result = await resendDeliveryEmail(id);
      if (!result.ok) return jsonError(result.error ?? "Could not resend", 400);
      return jsonOk({ resent: true });
    }
    case "delete": {
      deleteOrder(id);
      return jsonOk({ deleted: true });
    }
    default:
      return jsonError("Unsupported action", 422);
  }
});
