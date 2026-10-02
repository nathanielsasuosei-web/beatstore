import { z } from "zod";
import { cookies } from "next/headers";
import { createSessionToken, hashPassword, makeToken } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/data/users";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { absoluteUrl } from "@/lib/utils";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  stageName: z.string().max(80).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid details", 422);
  }

  const { name, email, password, stageName, phone, country } = parsed.data;
  const normalised = email.toLowerCase().trim();

  if (getUserByEmail(normalised)) {
    return jsonError("An account with that email already exists. Try signing in.", 409);
  }

  const verifyToken = makeToken(20);
  const user = createUser({
    name: name.trim(),
    email: normalised,
    passwordHash: await hashPassword(password),
    stageName: stageName?.trim() || null,
    phone: phone?.trim() || null,
    country: country?.trim() || null,
    verifyToken,
    role: "artist",
  });

  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  const verifyUrl = absoluteUrl(`/api/auth/verify?token=${verifyToken}`);
  const mail = welcomeEmail({ name: user.name, verifyUrl });
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, type: "welcome" });

  return jsonOk({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
}
