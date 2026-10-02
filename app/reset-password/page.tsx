import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="container-page grid place-items-center py-16">
      <div className="w-full max-w-md">
        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="surface-card p-6 text-center">
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
    </div>
  );
}
