import { clearSessionCookie } from "@/lib/auth";
import { apiHandler, jsonOk } from "@/lib/http";

export const POST = apiHandler(async () => {
  await clearSessionCookie();
  return jsonOk({ redirect: "/" });
});
