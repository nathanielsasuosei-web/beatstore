import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
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
    <div className="container-page grid place-items-center py-16">
      <div className="w-full max-w-md">
        <LoginForm redirectTo={params.next} />
        <div className="surface-card mt-4 p-4 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300">Demo accounts</p>
          <p className="mt-1.5">Artist — artist@nsobeats.test / Artist123!</p>
          <p>Producer — admin@nsobeats.test / Admin123!</p>
        </div>
      </div>
    </div>
  );
}
