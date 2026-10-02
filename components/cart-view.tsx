"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Music2, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/section";

export function CartView() {
  const { items, subtotal, remove, clear, ready } = useCart();
  const router = useRouter();

  if (!ready) {
    return <div className="surface-card h-40 animate-pulse" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        blurb="Browse the store and add a licence — mobile money, bank transfer and card all work at checkout."
        action={{ href: "/beats", label: "Browse beats" }}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.licenseId} className="surface-card flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-800">
              {item.coverImage ? (
                <Image src={item.coverImage} alt="" fill sizes="80px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/beats/${item.slug}`} className="truncate font-semibold hover:text-lime-300">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-400">
                    {item.licenseName}
                    {item.fileFormat ? ` · ${item.fileFormat}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {[item.bpm ? `${item.bpm} BPM` : null, item.musicalKey].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lime-300">{formatMoney(item.price)}</p>
                  <button
                    type="button"
                    onClick={() => remove(item.licenseId)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Link href="/beats" className="btn btn-secondary btn-sm">
            <Music2 className="h-4 w-4" /> Add more beats
          </Link>
          <button type="button" onClick={clear} className="text-xs text-zinc-500 hover:text-zinc-300">
            Clear cart
          </button>
        </div>
      </div>

      <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-zinc-400">
            <dt>Beats</dt>
            <dd>{items.length}</dd>
          </div>
          <div className="flex justify-between text-zinc-400">
            <dt>Subtotal</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-700 pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-lime-300">{formatMoney(subtotal)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          Checkout <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
          Pay with mobile money, bank transfer or card. Download links and your licence PDF are emailed
          automatically once payment clears.
        </p>
      </aside>
    </div>
  );
}
