"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Headphones, Pause, Play, ShoppingBag } from "lucide-react";
import { usePlayer, type Track } from "@/components/player-provider";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { cn, previewIsPlayable } from "@/lib/utils";

export type BeatCardData = {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  musicalKey: string | null;
  coverImage: string | null;
  previewFile: string | null;
  plays: number;
  tags: string | null;
  licenses: { id: string; tier: string; name: string; price: number; fileFormat: string | null; popular: boolean }[];
};

export function BeatCard({
  beat,
  queue = [],
  compact = false,
}: {
  beat: BeatCardData;
  queue?: BeatCardData[];
  compact?: boolean;
}) {
  const { toggle, isCurrent, playing } = usePlayer();
  const { add, hasBeat } = useCart();
  const [flash, setFlash] = useState<string | null>(null);

  const isThisPlaying = isCurrent(beat.slug) && playing;
  const playable = previewIsPlayable(beat.previewFile);
  const cheapest = beat.licenses.length ? Math.min(...beat.licenses.map((l) => l.price)) : 0;
  const inCart = hasBeat(beat.id);

  const track: Track = {
    slug: beat.slug,
    title: beat.title,
    coverImage: beat.coverImage,
    previewFile: beat.previewFile,
    bpm: beat.bpm,
    musicalKey: beat.musicalKey,
    genre: beat.genre,
    producer: "NSO Beats",
  };

  const queueTracks: Track[] = queue.map((b) => ({
    slug: b.slug,
    title: b.title,
    coverImage: b.coverImage,
    previewFile: b.previewFile,
    bpm: b.bpm,
    musicalKey: b.musicalKey,
    genre: b.genre,
    producer: "NSO Beats",
  }));

  function quickAdd() {
    const license = beat.licenses.find((l) => l.popular) ?? beat.licenses[0];
    if (!license) return;
    const result = add({
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
    });
    setFlash(result.added ? `Added ${license.name}` : result.reason ?? "Already in cart");
    setTimeout(() => setFlash(null), 2600);
  }

  return (
    <article
      className={cn(
        "group surface-card overflow-hidden transition-all duration-200 hover:border-ink-600",
        compact ? "p-3" : "p-3.5"
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-800">
        <Link href={`/beats/${beat.slug}`} aria-label={beat.title}>
          {beat.coverImage ? (
            <Image
              src={beat.coverImage}
              alt={`${beat.title} cover art`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-zinc-600">
              <Headphones className="h-10 w-10" />
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => toggle(track, queueTracks.length ? queueTracks : undefined)}
          disabled={!playable}
          title={playable ? undefined : "Preview coming soon"}
          className={cn(
            "absolute bottom-2.5 left-2.5 grid h-11 w-11 place-items-center rounded-full shadow-lg transition-all",
            !playable
              ? "cursor-not-allowed bg-ink-950/70 text-zinc-500 backdrop-blur"
              : isThisPlaying
                ? "bg-lime-400 text-ink-950 scale-105"
                : "bg-ink-950/85 text-white backdrop-blur hover:bg-lime-400 hover:text-ink-950"
          )}
          aria-label={
            !playable
              ? `${beat.title} has no preview yet`
              : isThisPlaying
                ? `Pause ${beat.title}`
                : `Play ${beat.title}`
          }
        >
          {isThisPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-px" />
          )}
        </button>

        {beat.mood && (
          <span className="absolute top-2.5 right-2.5 badge bg-ink-950/80 text-zinc-300 backdrop-blur">
            {beat.mood}
          </span>
        )}
        {beat.genre && (
          <span className="absolute top-2.5 left-2.5 badge bg-ink-950/80 text-lime-300 backdrop-blur">
            {beat.genre}
          </span>
        )}
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/beats/${beat.slug}`} className="min-w-0">
            <h3 className="truncate font-semibold leading-tight group-hover:text-lime-300">{beat.title}</h3>
          </Link>
          <span className="shrink-0 text-xs text-zinc-500">{beat.plays.toLocaleString()} plays</span>
        </div>

        <p className="mt-1 text-xs text-zinc-500">
          {[beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {beat.licenses.length} licences from
            </p>
            <p className="text-sm font-bold text-lime-300">{formatMoney(cheapest)}</p>
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={!beat.licenses.length}
            className={cn("btn btn-sm", inCart ? "btn-secondary" : "btn-primary")}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {inCart ? "In cart" : "Add"}
          </button>
        </div>

        {flash && <p className="mt-2 text-[11px] text-lime-300">{flash}</p>}
      </div>
    </article>
  );
}

export function BeatGrid({
  beats,
  columns = 4,
}: {
  beats: BeatCardData[];
  columns?: 3 | 4;
}) {
  if (!beats.length) {
    return (
      <div className="surface-card grid place-items-center gap-2 py-16 text-center">
        <Headphones className="h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">No beats match that yet — try another filter.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {beats.map((beat) => (
        <BeatCard key={beat.id} beat={beat} queue={beats} />
      ))}
    </div>
  );
}
