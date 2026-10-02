import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page grid place-items-center py-16">
      <div className="w-full max-w-md">
        <ForgotForm />
      </div>
    </div>
  );
}
