import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { paystackEnabled, simulationAllowed } from "@/lib/paystack";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <div className="container-page py-12">
      <CheckoutForm
        user={user ? { name: user.name, email: user.email } : null}
        paystackReady={paystackEnabled()}
        demoMode={simulationAllowed()}
        settings={{
          bank_name: settings.bank_name,
          bank_account_name: settings.bank_account_name,
          bank_account_number: settings.bank_account_number,
          momo_name: settings.momo_name,
          momo_mtn: settings.momo_mtn,
          momo_telecel: settings.momo_telecel,
          momo_at: settings.momo_at,
          currency: settings.currency,
        }}
      />
    </div>
  );
}
