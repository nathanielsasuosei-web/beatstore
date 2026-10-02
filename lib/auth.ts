import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getUserById } from "@/lib/data/users";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/constants";
import { hashPassword, makeToken, verifyPassword } from "@/lib/password";

// Re-exported so server code has a single auth import.
export { hashPassword, verifyPassword, makeToken };

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    // Dev fallback so the app boots without a .env file. Never used when AUTH_SECRET is set.
    "dev-only-insecure-secret-change-me-in-production";
  return new TextEncoder().encode(secret.padEnd(32, "!"));
}

/* ── sessions ──────────────────────────────────────────────── */

export async function createSessionToken(user: { id: string; role: string }) {
  return new SignJWT({ uid: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function setSessionCookie(user: { id: string; role: string }) {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Reads the session cookie and confirms the user still exists. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.uid as string | undefined;
    if (!uid) return null;
    const row = getUserById(uid);
    if (!row) return null;
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  } catch {
    return null;
  }
}
