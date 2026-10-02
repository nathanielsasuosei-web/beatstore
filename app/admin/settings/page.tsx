import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { emailMode } from "@/lib/email";
import { paystackEnabled } from "@/lib/paystack";

export default async function AdminSettingsPage() {
  const settings = await getSettings(true);

  const env = {
    paystack: paystackEnabled(),
    paystackPublic: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
    resend: emailMode() === "resend",
    emailFrom: process.env.EMAIL_FROM ?? "",
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    storage: process.env.STORAGE_DIR ?? "storage",
    database: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
    simulation: process.env.ENABLE_PAYMENT_SIMULATION === "true",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Store identity, payment details shown at checkout, and the numbers artists see. Secrets live in your
          environment file, not here.
        </p>
      </div>
      <SettingsForm settings={settings} env={env} />
    </div>
  );
}
