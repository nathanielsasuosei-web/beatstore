import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByReference } from "@/lib/data/sales";
import { paystackEnabled } from "@/lib/paystack";
import { formatMoney } from "@/lib/money";
import { PayOnlineButton } from "@/components/pay-online-button";

export const metadata: Metadata = { title: "Pay online" };

export default async function RetryPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = getOrderByReference(reference);
  if (!order) notFound();

  return (
    <div className="container-page py-16">
      <div className="surface-card mx-auto max-w-lg p-8 text-center">
        <h1 className="headline text-2xl text-ash-50">Pay online instead</h1>
        <p className="mt-3 text-sm text-ash-400">
          Order <strong className="text-ash-200">{order.reference}</strong> ·{" "}
          {formatMoney(order.total, order.currency)}. Paying now releases your files instantly.
        </p>
        <div className="mt-6">
          <PayOnlineButton reference={order.reference} enabled={paystackEnabled()} />
        </div>
      </div>
    </div>
  );
}
