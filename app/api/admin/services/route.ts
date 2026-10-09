import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { slugify } from "@/lib/utils";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { createService, listServices } from "@/lib/data/bookings";

const schema = z.object({
  name: z.string().min(2, "Give the service a name").max(60),
  description: z.string().max(400).optional().nullable(),
  pricePerHour: z.number().min(0, "Price can't be negative").max(1_000_000),
  minHours: z.number().int().min(1).max(16),
  maxHours: z.number().int().min(1).max(16),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export const POST = apiHandler(async (request: Request) => {
  if (!(await assertAdmin())) return unauthorized();

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid service details", 422);

  const { name, description, pricePerHour, minHours, maxHours, sortOrder } = parsed.data;
  if (maxHours < minHours) return jsonError("Max hours can't be lower than min hours.", 422);

  const base = slugify(name) || "service";
  let slug = base;
  let n = 2;
  while (listServices().some((s) => s.slug === slug)) {
    slug = `${base}-${n++}`;
  }

  const service = createService({
    slug,
    name,
    description: description ?? null,
    pricePerHour: Math.round(pricePerHour * 100), // form sends major units
    minHours,
    maxHours,
    sortOrder: sortOrder ?? listServices().length,
  });

  return jsonOk({ service });
});
