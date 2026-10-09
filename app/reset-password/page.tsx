import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Choose a new password and you're back in."
      blurb="Pick something strong — at least 8 characters. Your licences and receipts are waiting."
      bullets={[
        "At least 8 characters",
        "You'll be signed straight back in",
        "All purchases stay attached to your account",
      ]}
    >
      <div className="w-full max-w-md">
        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="animate-card-in surface-card p-6 text-center">
            <h1 className="text-xl font-bold">Reset link missing</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Use the link from your reset email, or request a fresh one.
            </p>
            <Link href="/forgot-password" className="btn btn-primary btn-sm mt-4">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
