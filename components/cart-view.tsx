"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Music2, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/section";

export function CartView() {
  const { items, subtotal, remove, clear, ready } = useCart();
  const router = useRouter();

  if (!ready) {
    return <div className="h-40 animate-pulse border border-ink-700 bg-ink-850" />;
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
      <div className="border-t border-ink-700">
        {items.map((item) => (
          <div key={item.licenseId} className="flex gap-4 border-b border-ink-700 py-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ink-700 bg-ink-850">
              {item.coverImage ? (
                <Image src={item.coverImage} alt="" fill sizes="80px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/beats/${item.slug}`}
                    className="truncate font-semibold hover:text-accent-300"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-ash-400">
                    {item.licenseName}
                    {item.fileFormat ? ` · ${item.fileFormat}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-ash-500">
                    {[item.bpm ? `${item.bpm} BPM` : null, item.musicalKey]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="headline nums text-accent-300">{formatMoney(item.price)}</p>
                  <button
                    type="button"
                    onClick={() => remove(item.licenseId)}
                    className="mono-sm mt-2 inline-flex items-center gap-1 text-ash-500 transition-colors hover:text-accent"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between py-4">
          <Link href="/beats" className="btn btn-secondary btn-sm">
            <Music2 className="h-3.5 w-3.5" /> Add more beats
          </Link>
          <button
            type="button"
            onClick={clear}
            className="mono-sm text-ash-500 transition-colors hover:text-accent"
          >
            Clear cart
          </button>
        </div>
      </div>

      <aside className="h-fit border border-ink-700 bg-ink-850 p-5 lg:sticky lg:top-24">
        <h2 className="headline text-sm text-ash-50">Order summary</h2>
        <dl className="mt-4">
          <div className="mono-sm flex justify-between border-b border-ink-800 py-2.5 text-ash-400">
            <dt>Beats</dt>
            <dd className="nums">{items.length}</dd>
          </div>
          <div className="mono-sm flex justify-between border-b border-ink-800 py-2.5 text-ash-400">
            <dt>Subtotal</dt>
            <dd className="nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between pt-3">
            <dt className="headline text-ash-50">Total</dt>
            <dd className="headline nums text-accent-300">{formatMoney(subtotal)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          Checkout <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mono-sm mt-4 border-t border-ink-700 pt-3 leading-relaxed text-ash-500">
          Pay with mobile money, bank transfer or card. Download links and your licence PDF are
          emailed automatically once payment clears.
        </p>
      </aside>
    </div>
  );
}
