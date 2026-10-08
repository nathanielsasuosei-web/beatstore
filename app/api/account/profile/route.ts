import { z } from "zod";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/data/users";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";

const schema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  stageName: z.string().max(80).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
  currentPassword: z.string().max(200).optional().nullable(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200).optional().nullable(),
});

export const POST = apiHandler(async (request: Request) => {
  const session = await getCurrentUser();
  if (!session) return jsonError("Please sign in first.", 401);

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const { name, stageName, phone, country, currentPassword, newPassword } = parsed.data;
  const values: Record<string, string | number | null> = {
    name: name.trim(),
    stageName: stageName?.trim() || null,
    phone: phone?.trim() || null,
    country: country?.trim() || null,
  };

  if (newPassword) {
    const user = getUserById(session.id);
    if (!user) return jsonError("Account not found.", 404);
    if (!currentPassword) return jsonError("Enter your current password to change it.", 422);
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return jsonError("Your current password is incorrect.", 401);
    values.passwordHash = await hashPassword(newPassword);
  }

  updateUser(session.id, values);
  return jsonOk({ message: newPassword ? "Profile and password updated." : "Profile updated." });
});
