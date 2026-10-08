"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  Zap,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

type Props = {
  user: { name: string; email: string } | null;
  paystackReady: boolean;
  demoMode: boolean;
  settings: {
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    momo_name: string;
    momo_mtn: string;
    momo_telecel: string;
    momo_at: string;
    currency: string;
  };
};

const METHOD_ICONS = {
  paystack: CreditCard,
  mobile_money: Smartphone,
  bank_transfer: Building2,
} as const;

export function CheckoutForm({ user, paystackReady, demoMode, settings }: Props) {
  const { items, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    country: "Ghana",
    note: "",
  });
  const [method, setMethod] = useState<"paystack" | "mobile_money" | "bank_transfer">(
    paystackReady ? "paystack" : "mobile_money"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return <div className="surface-card h-64 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="surface-card grid place-items-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold">Nothing to check out</h1>
        <p className="text-sm text-zinc-400">Add a beat licence to your cart first.</p>
        <Link href="/beats" className="btn btn-primary btn-sm">
          Browse beats
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ beatId: item.beatId, licenseId: item.licenseId })),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            country: form.country || null,
          },
          method,
          note: form.note || null,
        }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Checkout could not be started.");

      // Cart is now an order — clear it and follow the redirect.
      clear();
      const redirect = json.redirect;
      if (!redirect) throw new Error("Checkout did not return a payment link.");
      if (redirect.startsWith("http")) {
        window.location.href = redirect;
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-5">
        <div className="surface-card p-5">
          <h2 className="font-semibold">1. Who are the files for?</h2>
          <p className="mt-1 text-xs text-zinc-500">
            This name goes on your licence agreement, so use your legal or artist name as you want it printed.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kojo Mensah"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email for delivery
              </label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone (for MoMo confirmation)
              </label>
              <input
                id="phone"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+233 24 000 0000"
              />
            </div>
            <div>
              <label className="label" htmlFor="country">
                Country
              </label>
              <input
                id="country"
                className="input"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
          {!user && (
            <p className="mt-4 text-xs text-zinc-500">
              Checking out as a guest? That&apos;s fine — everything still arrives by email.{" "}
              <Link href="/register" className="link-accent">
                Create an account
              </Link>{" "}
              to keep your downloads in a dashboard.
            </p>
          )}
        </div>

        <div className="surface-card p-5">
          <h2 className="font-semibold">2. How would you like to pay?</h2>
          <div className="mt-4 space-y-3">
            {(Object.keys(PAYMENT_METHODS) as (keyof typeof PAYMENT_METHODS)[]).map((key) => {
              const meta = PAYMENT_METHODS[key];
              const Icon = METHOD_ICONS[key];
              const disabled = key === "paystack" && !paystackReady;
              const active = method === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    active ? "border-lime-400/60 bg-lime-400/[0.06]" : "border-ink-700 bg-ink-850 hover:border-ink-600",
                    disabled && "cursor-not-allowed opacity-55"
                  )}
                >
                  <input
                    type="radio"
                    name="method"
                    className="sr-only"
                    checked={active}
                    disabled={disabled}
                    onChange={() => setMethod(key)}
                  />
                  <span
                    className={cn(
                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      active ? "bg-lime-400 text-ink-950" : "bg-ink-800 text-zinc-400"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {meta.label}
                      {key === "paystack" && paystackReady && (
                        <span className="badge bg-lime-400/15 text-lime-300">Fastest</span>
                      )}
                      {key === "paystack" && !paystackReady && (
                        <span className="badge bg-ink-700 text-zinc-400">Needs Paystack key</span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-400">{meta.blurb}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {method === "mobile_money" && (
            <div className="mt-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-200">Send to:</p>
              <ul className="mt-2 space-y-1">
                <li>MTN MoMo — {settings.momo_mtn} ({settings.momo_name})</li>
                <li>Telecel Cash — {settings.momo_telecel}</li>
                <li>AT Money — {settings.momo_at}</li>
              </ul>
              <p className="mt-2 text-zinc-500">
                You&apos;ll get the order reference on the next screen to use as the payment reference.
              </p>
            </div>
          )}

          {method === "bank_transfer" && (
            <div className="mt-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-200">{settings.bank_name}</p>
              <ul className="mt-2 space-y-1">
                <li>Account name — {settings.bank_account_name}</li>
                <li>Account number — {settings.bank_account_number}</li>
              </ul>
              <p className="mt-2 text-zinc-500">
                Use your order reference as the transfer description so it&apos;s matched instantly.
              </p>
            </div>
          )}

          {!paystackReady && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {demoMode
                ? "Paystack keys are not configured, so online card/MoMo checkout shows a demo payment screen (no money moves). Real mobile money and bank details work exactly as normal."
                : "Online payments are unavailable right now — please use mobile money or bank transfer."}
            </p>
          )}
        </div>

        <div className="surface-card p-5">
          <h2 className="font-semibold">3. Anything the producer should know?</h2>
          <textarea
            rows={3}
            className="textarea mt-4 resize-y"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Optional — e.g. 'mixing at 96 BPM', 'need stems for a live band'."
          />
        </div>

        {error && (
          <p className="rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="surface-card p-5">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.licenseId} className="flex gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                  {item.coverImage ? <Image src={item.coverImage} alt="" fill sizes="48px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-zinc-500">{item.licenseName}</span>
                </span>
                <span className="text-sm font-semibold text-lime-300">{formatMoney(item.price, settings.currency)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-ink-700 pt-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal, settings.currency)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="text-lime-300">{formatMoney(subtotal, settings.currency)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-5 w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…
              </>
            ) : method === "paystack" ? (
              <>
                <Zap className="h-4 w-4" /> Pay {formatMoney(subtotal, settings.currency)}
              </>
            ) : (
              <>
                Get payment details <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
            Card and MoMo payments are processed by Paystack — card details never touch this server. Manual
            transfers are verified by the producer before files are released.
          </p>
        </div>

        <div className="surface-card p-5 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-200">What happens next</p>
          <ol className="mt-3 space-y-2">
            <li>1. You&apos;ll get an order reference (NSO-XXXXXX).</li>
            <li>2. Pay online, or send the money and submit the transaction ID.</li>
            <li>3. Download links + licence PDF are emailed automatically.</li>
          </ol>
        </div>
      </aside>
    </form>
  );
}
