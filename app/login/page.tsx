import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your sound, picked up right where you left off."
      blurb="Sign in and your whole library is waiting — stems, licences and receipts, one tap away."
      bullets={[
        "Instant downloads with licence PDFs included",
        "Receipts for every purchase, stored forever",
        "Your whole beat library in one place",
      ]}
    >
      <div className="w-full max-w-md">
        <LoginForm redirectTo={params.next} />
        <div
          className="animate-field-in surface-card mt-4 p-4 text-xs text-zinc-400"
          style={{ animationDelay: "420ms" }}
        >
          <p className="font-semibold text-zinc-300">Demo accounts</p>
          <p className="mt-1.5">Artist — artist@nsobeats.test / Artist123!</p>
          <p>Producer — admin@nsobeats.test / Admin123!</p>
        </div>
      </div>
    </AuthShell>
  );
}
