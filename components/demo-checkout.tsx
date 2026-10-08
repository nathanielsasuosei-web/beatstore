"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Info, Loader2, Lock, Smartphone, CreditCard, Building2, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

/**
 * Sandbox version of the hosted payment page, used when Paystack keys are not
 * configured. It walks through the same states as a real mobile-money prompt so
 * you can test the full buy → pay → email-delivery flow before going live.
 */
export function DemoCheckout({
  reference,
  total,
  currency,
  email,
  items,
}: {
  reference: string;
  total: number;
  currency: string;
  email: string;
  items: { title: string; licenseName: string; price: number }[];
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<"mobile_money" | "card" | "bank_transfer">("mobile_money");
  const [stage, setStage] = useState<"form" | "prompt" | "confirming" | "done" | "error">("form");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (stage !== "confirming") return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/payments/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, channel }),
        });
        const json = await safeJson(res);
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Test payment failed");
        setStage("done");
        setTimeout(() => router.push(`/checkout/success/${reference}`), 1200);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Test payment failed");
        setStage("error");
      }
    }, 2600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [stage, reference, channel, router]);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700 bg-ink-850 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime-400 text-ink-950">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Secure checkout (test mode)</p>
              <p className="text-[11px] text-zinc-500">No real money moves on this screen</p>
            </div>
          </div>
          <span className="badge bg-amber-500/15 text-amber-300">Sandbox</span>
        </div>

        <div className="p-5 sm:p-6">
          {stage === "form" && (
            <>
              <p className="text-sm text-zinc-400">
                Choose how you&apos;d like to pay in the test gateway, then confirm to release the order.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { id: "mobile_money" as const, label: "Mobile Money", hint: "MTN MoMo · Telecel Cash · AT", icon: Smartphone },
                  { id: "card" as const, label: "Card", hint: "Visa · Mastercard", icon: CreditCard },
                  { id: "bank_transfer" as const, label: "Bank transfer", hint: "Pay from your bank app", icon: Building2 },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setChannel(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
                      channel === option.id
                        ? "border-lime-400/60 bg-lime-400/[0.06]"
                        : "border-ink-700 bg-ink-850 hover:border-ink-600"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl",
                        channel === option.id ? "bg-lime-400 text-ink-950" : "bg-ink-800 text-zinc-400"
                      )}
                    >
                      <option.icon className="h-4.5 w-4.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-zinc-500">{option.hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              {channel === "mobile_money" && (
                <div className="mt-5">
                  <label className="label" htmlFor="phone">
                    Mobile money number
                  </label>
                  <input
                    id="phone"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024 000 0000"
                  />
                </div>
              )}

              <div className="mt-5">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input id="email" className="input" defaultValue={email} readOnly />
              </div>

              <button
                type="button"
                onClick={() => setStage(channel === "mobile_money" ? "prompt" : "confirming")}
                className="btn btn-primary btn-lg mt-6 w-full"
              >
                Pay {formatMoney(total, currency)}
              </button>

              <p className="mt-4 flex items-start gap-2 text-[11px] text-zinc-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This is the sandbox checkout shown because Paystack keys aren&apos;t configured. Add{" "}
                <code className="rounded bg-ink-800 px-1">PAYSTACK_SECRET_KEY</code> to your environment and
                real mobile money, card and bank payments switch on automatically — no code changes.
              </p>
            </>
          )}

          {stage === "prompt" && (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-400/15 text-lime-300">
                <Smartphone className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold">Approve the payment on your phone</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
                A prompt for <strong>{formatMoney(total, currency)}</strong> would be sent to{" "}
                {phone || "your mobile money number"} now. Enter your MoMo PIN to approve it.
              </p>
              <button type="button" onClick={() => setStage("confirming")} className="btn btn-primary mt-6">
                Simulate approving the prompt
              </button>
            </div>
          )}

          {stage === "confirming" && (
            <div className="grid place-items-center gap-3 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
              <p className="text-sm font-medium">Confirming your payment…</p>
              <p className="text-xs text-zinc-500">
                Matching transaction for order {reference}
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <p className="text-sm font-semibold text-lime-300">Payment successful</p>
              <p className="text-xs text-zinc-500">Sending you to your downloads…</p>
            </div>
          )}

          {stage === "error" && (
            <div className="grid place-items-center gap-3 py-12 text-center">
              <p className="text-sm font-semibold text-red-400">Test payment failed</p>
              <p className="text-xs text-zinc-500">{error}</p>
              <button type="button" onClick={() => setStage("form")} className="btn btn-secondary btn-sm">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="surface-card h-fit p-5">
        <h2 className="font-semibold">Order {reference}</h2>
        <ul className="mt-4 space-y-2.5 text-sm">
          {items.map((item) => (
            <li key={item.title} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-zinc-300">{item.title}</span>
                <span className="block text-xs text-zinc-500">{item.licenseName}</span>
              </span>
              <span className="font-semibold text-lime-300">{formatMoney(item.price, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-ink-700 pt-4 text-base font-bold">
          <span>Total</span>
          <span className="text-lime-300">{formatMoney(total, currency)}</span>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
          On live payments this page is replaced by Paystack&apos;s secure page.
        </p>
      </aside>
    </div>
  );
}
