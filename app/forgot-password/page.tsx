import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Locked out?"
      title="We'll get you back into the studio."
      blurb="Enter the email you signed up with and a reset link lands in your inbox within a minute."
      bullets={[
        "Reset links arrive within a minute",
        "Works for artist and producer accounts",
        "Your library stays exactly as you left it",
      ]}
    >
      <div className="w-full max-w-md">
        <ForgotForm />
      </div>
    </AuthShell>
  );
}
