"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Headphones, Pause, Play, Plus } from "lucide-react";
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
  licenses: {
    id: string;
    tier: string;
    name: string;
    price: number;
    fileFormat: string | null;
    popular: boolean;
  }[];
};

export function BeatCard({
  beat,
  queue = [],
  compact = false,
  index,
}: {
  beat: BeatCardData;
  queue?: BeatCardData[];
  compact?: boolean;
  index?: number;
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
    setFlash(result.added ? `Added — ${license.name}` : (result.reason ?? "Already in cart"));
    setTimeout(() => setFlash(null), 2600);
  }

  return (
    <article className="group relative">
      {/* ── cover ─────────────────────────────────────────── */}
      <div
        className={cn(
          "lift relative aspect-square overflow-hidden border border-ink-700 bg-ink-850",
          compact ? "rounded-none" : "",
        )}
      >
        <Link href={`/beats/${beat.slug}`} aria-label={beat.title} className="block h-full w-full">
          {beat.coverImage ? (
            <Image
              src={beat.coverImage}
              alt={`${beat.title} cover art`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover transition-[filter] duration-150 group-hover:contrast-125"
            />
          ) : (
            <div className="grid h-full place-items-center text-ink-600">
              <Headphones className="h-10 w-10" />
            </div>
          )}
        </Link>

        {/* play / pause — hard square, bottom left */}
        <button
          type="button"
          onClick={() => toggle(track, queueTracks.length ? queueTracks : undefined)}
          disabled={!playable}
          title={playable ? undefined : "Preview coming soon"}
          className={cn(
            "absolute bottom-0 left-0 grid h-11 w-11 place-items-center border-t border-r border-ink-700 transition-colors duration-150",
            !playable
              ? "cursor-not-allowed bg-ink-950/80 text-ash-600"
              : isThisPlaying
                ? "border-accent bg-accent text-ash-50"
                : "bg-ink-950/85 text-ash-50 hover:bg-accent hover:text-ash-50",
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
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-px" />
          )}
        </button>

        {/* genre — top right, mono, printed on ink */}
        {beat.genre && (
          <span className="mono-sm absolute right-0 top-0 bg-ink-950/85 px-2 py-1 text-ash-200">
            {beat.genre}
          </span>
        )}
        {isThisPlaying && (
          <span className="eq absolute bottom-3 right-3 text-accent">
            <span />
            <span />
            <span />
            <span />
          </span>
        )}
      </div>

      {/* ── meta ──────────────────────────────────────────── */}
      <div className="pt-3">
        <div className="flex items-baseline gap-2">
          {typeof index === "number" && (
            <span className="mono-sm nums shrink-0 text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <h3 className="headline min-w-0 flex-1 truncate text-base text-ash-50">
            <Link href={`/beats/${beat.slug}`} className="hover:text-accent-300">
              {beat.title}
            </Link>
          </h3>
        </div>

        <p className="mono-sm nums mt-1 truncate text-ash-500">
          {[beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey, beat.mood]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink-700 pt-2.5">
          <div className="min-w-0">
            <p className="mono-sm text-ash-600">From</p>
            <p className="headline nums text-base text-accent-300">{formatMoney(cheapest)}</p>
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={!beat.licenses.length}
            aria-label={`Add ${beat.title} to cart`}
            className={cn("btn btn-sm", inCart ? "btn-secondary" : "btn-primary")}
          >
            {!inCart && <Plus className="h-3.5 w-3.5" />}
            {inCart ? "In cart" : "Add"}
          </button>
        </div>

        {flash && (
          <p className="mono-sm mt-2 text-accent-300" role="status">
            {flash}
          </p>
        )}
      </div>
    </article>
  );
}

export function BeatGrid({ beats, columns = 4 }: { beats: BeatCardData[]; columns?: 3 | 4 }) {
  if (!beats.length) {
    return (
      <div className="border border-dashed border-ink-600 py-16 text-center">
        <p className="mono-sm text-ash-500">No results</p>
        <p className="mt-2 text-sm text-ash-400">Nothing matches that yet — try another filter.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-10 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {beats.map((beat, i) => (
        <BeatCard key={beat.id} beat={beat} queue={beats} index={i} />
      ))}
    </div>
  );
}
