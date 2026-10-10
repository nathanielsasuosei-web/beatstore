import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getOrderByReference } from "@/lib/data/sales";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { ClaimPaymentForm } from "@/components/claim-payment-form";
import { paystackEnabled } from "@/lib/paystack";

export const metadata: Metadata = { title: "Complete your payment" };

export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = getOrderByReference(reference);
  if (!order) notFound();
  const settings = await getSettings();

  if (order.status === "paid") {
    return (
      <div className="container-page py-16">
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-accent-400" />
          <h1 className="mt-4 text-xl font-bold">This order is already paid</h1>
          <p className="mt-2 text-sm text-ash-400">
            Order {order.reference} is complete — your download links were emailed to {order.email}.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/checkout/success/${order.reference}`} className="btn btn-primary btn-sm">
              View downloads
            </Link>
            <Link href="/account" className="btn btn-secondary btn-sm">
              My dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMomo = order.paymentMethod === "mobile_money";

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mono-sm text-ash-500">Order reference</p>
              <h1 className="display text-2xl text-ash-50">{order.reference}</h1>
            </div>
            <div className="text-right">
              <p className="mono-sm text-ash-500">Amount to send</p>
              <p className="headline nums text-2xl text-accent-300">
                {formatMoney(order.total, order.currency)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-xs text-amber-200">
            <Clock className="h-4 w-4 shrink-0" />
            {order.status === "awaiting_verification"
              ? "Your payment details have been submitted — the producer is verifying them now. Files are released automatically once confirmed."
              : "Send the exact amount using the details below, then submit your transaction ID to release the files."}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {isMomo ? (
              <>
                <Detail title="MTN Mobile Money" lines={[settings.momo_mtn, settings.momo_name]} />
                <Detail title="Telecel Cash" lines={[settings.momo_telecel, settings.momo_name]} />
                <Detail title="AT Money" lines={[settings.momo_at, settings.momo_name]} />
                <Detail
                  title="Reference to quote"
                  lines={[order.reference, "Use this as the payment reference"]}
                />
              </>
            ) : (
              <>
                <Detail
                  title={settings.bank_name}
                  lines={[settings.bank_account_name, settings.bank_account_number]}
                />
                <Detail title="Branch" lines={[settings.bank_branch]} />
                <Detail title="Transfer description" lines={[order.reference]} />
                <Detail title="Amount" lines={[formatMoney(order.total, order.currency)]} />
              </>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ash-400">
            {settings.pay_instructions}
          </p>

          {paystackEnabled() && (
            <p className="mt-4 text-xs text-ash-500">
              Changed your mind? You can also{" "}
              <Link href={`/checkout/retry/${order.reference}`} className="link-accent">
                pay online with mobile money or card
              </Link>{" "}
              instead.
            </p>
          )}
        </div>

        <div className="mt-6">
          <ClaimPaymentForm
            reference={order.reference}
            alreadySubmitted={order.status === "awaiting_verification"}
            payerNote={order.payerNote}
          />
        </div>

        <div className="surface-card mt-6 p-5">
          <h2 className="headline text-sm text-ash-50">Order contents</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="text-ash-300">
                  {item.title} <span className="text-ash-500">· {item.licenseName}</span>
                </span>
                <span className="headline nums text-accent-300">
                  {formatMoney(item.price, item.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-ash-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Files are never released before payment is confirmed. If you sent the money and
            submitted the reference, everything is in hand — reply to the confirmation email if you
            need anything.
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className=" border border-ink-700 bg-ink-850 p-4">
      <p className="mono-sm text-ash-500">{title}</p>
      {lines.filter(Boolean).map((line, index) => (
        <p
          key={index}
          className={index === 0 ? "mt-1 text-base font-semibold" : "text-xs text-ash-400"}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
