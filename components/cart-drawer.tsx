"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { TIER_META, type LicenseTier } from "@/lib/constants";

export function CartDrawer() {
  const { items, open, setOpen, remove, subtotal, clear } = useCart();
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 "
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-950">
        <header className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="headline text-sm text-ash-50">Your cart</h2>
            <span className="chip">{items.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="mono-sm text-ash-500">Empty</p>
            <p className="mt-2 text-sm leading-relaxed text-ash-400">
              Nothing here yet. Add a licence from any beat and it lands here.
            </p>
            <Link href="/beats" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
              Browse beats
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-ink-700 overflow-y-auto border-b border-ink-700">
              {items.map((item) => (
                <div key={item.licenseId} className="flex gap-3 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-ink-700 bg-ink-850">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/beats/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="headline block truncate text-sm text-ash-50 hover:text-accent-300"
                    >
                      {item.title}
                    </Link>
                    <p className="mono-sm mt-1 text-ash-500">
                      {item.licenseName}
                      {item.fileFormat ? ` · ${item.fileFormat}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="headline nums text-sm text-accent-300">
                        {formatMoney(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(item.licenseId)}
                        className="text-ash-500 transition-colors hover:text-accent"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={clear}
                className="text-xs text-ash-500 hover:text-ash-300"
              >
                Clear cart
              </button>
            </div>

            <footer className="px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="mono-sm text-ash-400">Subtotal</span>
                <span className="headline nums text-lg text-ash-50">{formatMoney(subtotal)}</span>
              </div>
              <p className="mono-sm mt-2 leading-relaxed text-ash-500">
                Instantly deliverable by email after payment · Mobile Money, bank transfer or card
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/checkout");
                }}
                className="btn btn-primary btn-lg mt-4 w-full"
              >
                Checkout · {formatMoney(subtotal)}
              </button>
              <p className="mono-sm mt-2 text-center leading-relaxed text-ash-500">
                {items.some((i) => i.tier === "exclusive")
                  ? "Includes an exclusive licence — the beat is removed from the store once paid."
                  : `Includes ${TIER_META[(items[0]?.tier as LicenseTier) ?? "basic"].label} terms.`}
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
