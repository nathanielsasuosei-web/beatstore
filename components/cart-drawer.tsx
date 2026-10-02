"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, X } from "lucide-react";
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-lime-400" />
            <h2 className="font-semibold">Your cart</h2>
            <span className="chip">{items.length}</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-800">
              <ShoppingBag className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">
              Nothing here yet. Add a licence from any beat and it lands here.
            </p>
            <Link href="/beats" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
              Browse beats
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <div key={item.licenseId} className="flex gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                    {item.coverImage ? (
                      <Image src={item.coverImage} alt={item.title} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/beats/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="block truncate text-sm font-semibold hover:text-lime-300"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {item.licenseName}
                      {item.fileFormat ? ` · ${item.fileFormat}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-lime-300">
                        {formatMoney(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(item.licenseId)}
                        className="text-zinc-500 hover:text-red-400"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={clear} className="text-xs text-zinc-500 hover:text-zinc-300">
                Clear cart
              </button>
            </div>

            <footer className="border-t border-ink-700 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-lg font-bold">{formatMoney(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
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
              <p className="mt-2 text-center text-[11px] text-zinc-500">
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
