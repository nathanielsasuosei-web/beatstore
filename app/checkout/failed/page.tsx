import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { getOrderByReference } from "@/lib/data/sales";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Payment not completed" };

const REASONS: Record<string, string> = {
  "missing-reference": "That payment link was missing its reference.",
  "unknown-order": "We couldn't match that payment to an order on this store.",
  verify:
    "Paystack couldn't confirm the transaction. Nothing was charged twice — if money left your account, it will be refunded or matched to your order.",
  failed: "The payment was declined by the provider.",
  abandoned: "The payment was cancelled before it completed.",
};

export default async function FailedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; reason?: string }>;
}) {
  const { ref, reason } = await searchParams;
  const order = ref ? getOrderByReference(ref) : null;
  const settings = await getSettings();

  return (
    <div className="container-page py-16">
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-400" />
        <h1 className="mt-4 headline text-2xl text-ash-50">Payment not completed</h1>
        <p className="mt-3 text-sm text-ash-400">
          {REASONS[reason ?? ""] ?? "The payment didn't go through, so the order is still open."}
        </p>

        {order && (
          <div className="mt-6 border border-ink-700 bg-ink-850 p-4 text-left text-sm">
            <p className="mono-sm text-ash-500">Order</p>
            <p className="font-semibold">{order.reference}</p>
            <p className="mt-2 text-xs text-ash-400">
              {order.items.map((i) => i.title).join(", ")} ·{" "}
              {formatMoney(order.total, order.currency)}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {order && (
            <Link href={`/checkout/pay/${order.reference}`} className="btn btn-primary btn-sm">
              Try another payment method
            </Link>
          )}
          <Link href="/beats" className="btn btn-secondary btn-sm">
            Back to the store
          </Link>
          <Link href="/contact" className="btn btn-ghost btn-sm">
            Get help
          </Link>
        </div>

        <p className="mt-6 text-xs text-ash-500">
          Mobile money and bank transfers always work — send the amount and submit your transaction
          ID. Any question goes straight to {settings.support_email}.
        </p>
      </div>
    </div>
  );
}
