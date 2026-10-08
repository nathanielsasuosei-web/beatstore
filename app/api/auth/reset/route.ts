import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { getUserByResetToken, updateUser } from "@/lib/data/users";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";

const schema = z.object({
  token: z.string().min(10, "Reset link is invalid"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = apiHandler(async (request: Request) => {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const user = getUserByResetToken(parsed.data.token);
  if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
    return jsonError("That reset link has expired. Request a new one.", 400);
  }

  updateUser(user.id, {
    passwordHash: await hashPassword(parsed.data.password),
    resetToken: null,
    resetExpires: null,
  });

  return jsonOk({ message: "Password updated. You can sign in now." });
});
