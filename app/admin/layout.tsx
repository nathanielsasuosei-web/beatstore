import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/admin-shell";
import { messageCounts } from "@/lib/data/inbox";
import { listOrders } from "@/lib/data/sales";
import { emailMode } from "@/lib/email";
import { paystackEnabled } from "@/lib/paystack";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");

  const [settings] = await Promise.all([getSettings()]);
  const counts = messageCounts();
  const { total: pendingOrders } = listOrders({ status: "awaiting_verification", limit: 1 });

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      siteName={settings.site_name}
      badges={{ messages: counts.new, orders: pendingOrders }}
      status={{
        paystack: paystackEnabled(),
        email: emailMode(),
      }}
    >
      {children}
    </AdminShell>
  );
}
