"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Download, FileAudio, Lock, Mail, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { usePlayer, type Track } from "@/components/player-provider";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BeatCardData } from "@/components/beat-card";

export function BuyPanel({ beat, producer }: { beat: BeatCardData; producer: string }) {
  const licenses = beat.licenses;
  const [selected, setSelected] = useState(
    licenses.find((l) => l.popular)?.id ?? licenses[0]?.id ?? ""
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
      <div className="surface-card p-5 text-sm text-zinc-400">
        This beat is not currently for sale. <a href="/contact" className="link-accent">Message the producer</a>
        {" "}about a custom version.
      </div>
    );
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Choose your licence</h2>
        <span className="text-xs text-zinc-500">{licenses.length} options</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {licenses.map((option) => {
          const active = option.id === selected;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition",
                active
                  ? "border-lime-400/60 bg-lime-400/[0.06]"
                  : "border-ink-700 bg-ink-850 hover:border-ink-600"
              )}
            >
              <input
                type="radio"
                name="license"
                className="sr-only"
                checked={active}
                onChange={() => setSelected(option.id)}
              />
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  active ? "border-lime-400 bg-lime-400 text-ink-950" : "border-ink-600"
                )}
              >
                {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {option.name}
                    {option.popular && (
                      <span className="badge bg-lime-400/15 text-lime-300">Popular</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-lime-300">{formatMoney(option.price)}</span>
                </span>
                {option.fileFormat && (
                  <span className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                    <FileAudio className="h-3.5 w-3.5" /> {option.fileFormat}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={buyNow} className="btn btn-primary btn-lg w-full">
          <Zap className="h-4 w-4" /> Buy now · {formatMoney(license?.price ?? 0)}
        </button>
        <button type="button" onClick={addToCart} className="btn btn-secondary w-full">
          <ShoppingBag className="h-4 w-4" />
          {license && has(license.id) ? "In cart — add another licence" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => toggle(track)}
          className="btn btn-ghost btn-sm w-full"
        >
          {isCurrent(beat.slug) && playing ? "Pause preview" : "Listen to the tagged preview"}
        </button>
      </div>

      {flash && <p className="mt-3 text-xs text-lime-300">{flash}</p>}

      <ul className="mt-5 space-y-2.5 border-t border-ink-700 pt-5 text-xs text-zinc-400">
        <li className="flex gap-2">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
          Download links + licence PDF are emailed the moment payment clears.
        </li>
        <li className="flex gap-2">
          <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
          Links stay valid for 30 days, and live in your artist dashboard too.
        </li>
        <li className="flex gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
          Mobile money, bank transfer or card. Files are never shared without payment.
        </li>
      </ul>
    </div>
  );
}
