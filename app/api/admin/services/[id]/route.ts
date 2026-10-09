import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { deleteService, getServiceById, updateService } from "@/lib/data/bookings";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(400).optional().nullable(),
  pricePerHour: z.number().min(0).max(1_000_000).optional(),
  minHours: z.number().int().min(1).max(16).optional(),
  maxHours: z.number().int().min(1).max(16).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export const PATCH = apiHandler(async (request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid service details", 422);

  const service = getServiceById(id);
  if (!service) return jsonError("Service not found", 404);

  const values: Record<string, string | number | null> = {};
  if (parsed.data.name !== undefined) values.name = parsed.data.name;
  if (parsed.data.description !== undefined) values.description = parsed.data.description;
  if (parsed.data.pricePerHour !== undefined) values.pricePerHour = Math.round(parsed.data.pricePerHour * 100);
  if (parsed.data.minHours !== undefined) values.minHours = parsed.data.minHours;
  if (parsed.data.maxHours !== undefined) values.maxHours = parsed.data.maxHours;
  if (parsed.data.active !== undefined) values.active = parsed.data.active ? 1 : 0;
  if (parsed.data.sortOrder !== undefined) values.sortOrder = parsed.data.sortOrder;

  const min = Number(values.minHours ?? service.minHours);
  const max = Number(values.maxHours ?? service.maxHours);
  if (max < min) return jsonError("Max hours can't be lower than min hours.", 422);

  updateService(id, values);
  return jsonOk({ service: getServiceById(id) });
});

export const DELETE = apiHandler(async (_request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const service = getServiceById(id);
  if (!service) return jsonError("Service not found", 404);

  deleteService(id);
  return jsonOk({ deleted: true });
});
