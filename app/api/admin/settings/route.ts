import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { setSettings } from "@/lib/settings";
import { jsonError, jsonOk, readJson } from "@/lib/http";

const schema = z.record(z.string().max(120), z.string().max(4000));

export async function POST(request: Request) {
  if (!(await assertAdmin())) return unauthorized();

  const body = await readJson<unknown>(request);
  const values = schema.safeParse(body);
  if (!values.success) return jsonError("Settings payload is invalid", 422);

  // Guardrails so nobody bricks the store.
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(values.data)) {
    if (!/^[a-z0-9_]{2,60}$/.test(key)) continue;
    cleaned[key] = String(value);
  }
  if (cleaned.currency && !/^[A-Z]{3}$/.test(cleaned.currency)) {
    return jsonError("Currency must be a 3-letter code such as GHS.", 422);
  }

  await setSettings(cleaned);
  return jsonOk({ saved: Object.keys(cleaned).length });
}
