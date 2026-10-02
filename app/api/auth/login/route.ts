import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { getUserByEmail, updateUser } from "@/lib/data/users";
import { jsonError, jsonOk, readJson } from "@/lib/http";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const email = parsed.data.email.toLowerCase().trim();
  const user = getUserByEmail(email);
  // Same message for unknown email and bad password so we don't leak accounts.
  if (!user) return jsonError("Email or password is incorrect.", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return jsonError("Email or password is incorrect.", 401);

  await setSessionCookie(user);
  updateUser(user.id, { lastLoginAt: Date.now() });

  return jsonOk({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    redirect: user.role === "admin" ? "/admin" : "/account",
  });
}
