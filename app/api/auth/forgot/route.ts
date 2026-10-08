import { z } from "zod";
import { makeToken } from "@/lib/auth";
import { getUserByEmail, updateUser } from "@/lib/data/users";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { apiHandler, jsonError, jsonOk, readJson } from "@/lib/http";
import { absoluteUrl } from "@/lib/utils";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export const POST = apiHandler(async (request: Request) => {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid email", 422);

  const email = parsed.data.email.toLowerCase().trim();
  const user = getUserByEmail(email);

  // Always answer the same way, whether or not the account exists.
  if (user) {
    const resetToken = makeToken(20);
    updateUser(user.id, { resetToken, resetExpires: Date.now() + 60 * 60 * 1000 });
    const mail = passwordResetEmail({
      name: user.name,
      resetUrl: absoluteUrl(`/reset-password?token=${resetToken}`),
    });
    await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, type: "password-reset" });
  }

  return jsonOk({ message: "If that email is registered, a reset link is on its way." });
});
