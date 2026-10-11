"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { usePlayer, type Track } from "@/components/player-provider";
import { formatMoney } from "@/lib/money";
import { cn, previewIsPlayable } from "@/lib/utils";
import type { BeatCardData } from "@/components/beat-card";

export function BuyPanel({ beat, producer }: { beat: BeatCardData; producer: string }) {
  const licenses = beat.licenses;
  const [selected, setSelected] = useState(
    licenses.find((l) => l.popular)?.id ?? licenses[0]?.id ?? "",
  );
  const [flash, setFlash] = useState<string | null>(null);
  const { add, has } = useCart();
  const { toggle, isCurrent, playing } = usePlayer();
  const router = useRouter();

  const license = licenses.find((l) => l.id === selected) ?? licenses[0];

  const track: Track = {
    slug: beat.slug,
    title: beat.title,
    coverImage: beat.coverImage,
    previewFile: beat.previewFile,
    bpm: beat.bpm,
    musicalKey: beat.musicalKey,
    genre: beat.genre,
    producer,
  };

  function payload() {
    if (!license) return null;
    return {
      beatId: beat.id,
      licenseId: license.id,
      slug: beat.slug,
      title: beat.title,
      tier: license.tier,
      licenseName: license.name,
      price: license.price,
      coverImage: beat.coverImage,
      fileFormat: license.fileFormat,
      bpm: beat.bpm,
      musicalKey: beat.musicalKey,
    };
  }

  function addToCart() {
    const item = payload();
    if (!item) return;
    const result = add(item);
    if (!result.added) setFlash(result.reason ?? "Already in your cart");
  }

  function buyNow() {
    const item = payload();
    if (!item) return;
    add(item);
    router.push("/checkout");
  }

  if (!licenses.length) {
    return (
      <div className="border border-ink-700 bg-ink-850 p-5 text-sm text-ash-400">
        This beat is not currently for sale.{" "}
        <a href="/contact" className="link-accent">
          Message the producer
        </a>
        {""}about a custom version.
      </div>
    );
  }

  return (
    <div className="border border-ink-700 bg-ink-850">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <h2 className="headline text-sm text-ash-50">Choose your licence</h2>
        <span className="mono-sm text-ash-500">{licenses.length} options</span>
      </div>

      <div className="divide-y divide-ink-700">
        {licenses.map((option) => {
          const active = option.id === selected;
          return (
            <label
              key={option.id}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors",
                active ? "bg-accent-600/10" : "hover:bg-ink-800",
              )}
            >
              <input
                type="radio"
                name="license"
                className="sr-only"
                checked={active}
                onChange={() => setSelected(option.id)}
              />
              {active && <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-accent" />}
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center border",
                  active ? "border-accent bg-accent text-ash-50" : "border-ink-600",
                )}
              >
                {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="headline text-sm text-ash-50">
                    {option.name}
                    {option.popular && (
                      <span className="mono-sm ml-2 text-accent-300">Most taken</span>
                    )}
                  </span>
                  <span className="headline nums shrink-0 text-sm text-accent-300">
                    {formatMoney(option.price)}
                  </span>
                </span>
                {option.fileFormat && (
                  <span className="mono-sm mt-1.5 block text-ash-500">{option.fileFormat}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div className="grid gap-2 border-t border-ink-700 p-4">
        <button type="button" onClick={buyNow} className="btn btn-primary btn-lg w-full">
          Buy now · {formatMoney(license?.price ?? 0)}
        </button>
        <button type="button" onClick={addToCart} className="btn btn-secondary w-full">
          <ShoppingBag className="h-3.5 w-3.5" />
          {license && has(license.id) ? "In cart — add another licence" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => toggle(track)}
          disabled={!previewIsPlayable(beat.previewFile)}
          title={previewIsPlayable(beat.previewFile) ? undefined : "Preview coming soon"}
          className={cn(
            "btn btn-ghost btn-sm w-full",
            !previewIsPlayable(beat.previewFile) && "opacity-50",
          )}
        >
          {!previewIsPlayable(beat.previewFile)
            ? "No preview available yet"
            : isCurrent(beat.slug) && playing
              ? "Pause preview"
              : "Listen to the tagged preview"}
        </button>
      </div>

      <div className="border-t border-ink-700 px-4 py-3">
        {flash && (
          <p className="mono-sm mb-2 text-accent-300" role="status">
            {flash}
          </p>
        )}
        <ul className="divide-y divide-ink-700 text-xs leading-relaxed text-ash-400">
          <li className="py-2 first:pt-0">
            Download links and your licence PDF are emailed the moment payment clears.
          </li>
          <li className="py-2">Links stay valid 30 days, and live in your artist dashboard.</li>
          <li className="py-2">
            Mobile money, bank transfer or card. Files are never shared before payment.
          </li>
        </ul>
      </div>
    </div>
  );
}
