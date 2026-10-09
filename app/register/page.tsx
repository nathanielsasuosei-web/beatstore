import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an artist account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  return (
    <AuthShell
      eyebrow="Join the wave"
      title="Create your artist account in under a minute."
      blurb="Free, no spam — just a home for every beat, licence and receipt you pick up."
      bullets={[
        "Free account, no spam, cancel anytime",
        "Faster checkout with saved details",
        "Every licence and receipt in one place",
        "Guest checkout still works if you're in a rush",
      ]}
    >
      <div className="w-full max-w-xl">
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
