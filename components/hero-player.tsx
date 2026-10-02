"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, ShoppingBag, Sparkles } from "lucide-react";
import { usePlayer, type Track } from "@/components/player-provider";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BeatCardData } from "@/components/beat-card";

export function HeroPlayer({
  beat,
  queue,
  producer,
}: {
  beat?: BeatCardData | null;
  queue: BeatCardData[];
  producer: string;
}) {
  const { toggle, isCurrent, playing } = usePlayer();

  if (!beat) {
    return (
      <div className="surface-card grid place-items-center p-10 text-center text-sm text-zinc-500">
        No beats published yet. Upload your first beat from the admin dashboard.
      </div>
    );
  }

  const toTrack = (b: BeatCardData): Track => ({
    slug: b.slug,
    title: b.title,
    coverImage: b.coverImage,
    previewFile: b.previewFile,
    bpm: b.bpm,
    musicalKey: b.musicalKey,
    genre: b.genre,
    producer,
  });

  const isPlaying = isCurrent(beat.slug) && playing;
  const popular = beat.licenses.find((l) => l.popular) ?? beat.licenses[0];

  return (
    <div className="relative">
      <div className="surface-card relative overflow-hidden p-4 shadow-2xl">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink-800">
          {beat.coverImage ? (
            <Image
              src={beat.coverImage}
              alt={`${beat.title} artwork`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-zinc-600">No artwork</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent p-5 pt-16">
            <p className="chip chip-accent mb-3 w-fit">
              <Sparkles className="h-3.5 w-3.5" /> Latest drop
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white">{beat.title}</h2>
            <p className="mt-1 text-sm text-zinc-300">
              {[beat.genre, beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle(toTrack(beat), queue.map(toTrack))}
            className={cn(
              "absolute left-1/2 top-[42%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-2xl transition",
              isPlaying ? "bg-lime-400 text-ink-950" : "bg-ink-950/80 text-white backdrop-blur hover:bg-lime-400 hover:text-ink-950"
            )}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">{popular?.name ?? "Licence"}</p>
            <p className="text-lg font-bold text-lime-300">{formatMoney(popular?.price ?? 0)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggle(toTrack(beat), queue.map(toTrack))}
              className="btn btn-secondary btn-sm"
            >
              {isPlaying ? "Pause" : "Preview"}
            </button>
            <Link href={`/beats/${beat.slug}`} className="btn btn-primary btn-sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Buy licence
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {queue.slice(0, 2).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(toTrack(item), queue.map(toTrack))}
            className="surface-card flex items-center gap-3 p-2.5 text-left transition hover:border-ink-600"
          >
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-800">
              {item.coverImage ? (
                <Image src={item.coverImage} alt="" fill sizes="40px" className="object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">{item.title}</span>
              <span className="block text-[11px] text-zinc-500">
                {isCurrent(item.slug) && playing ? "Playing now" : item.genre ?? "Preview"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
