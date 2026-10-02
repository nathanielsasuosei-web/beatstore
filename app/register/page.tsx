import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an artist account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  return (
    <div className="container-page grid place-items-center py-16">
      <div className="w-full max-w-xl">
        <RegisterForm />
      </div>
    </div>
  );
}
