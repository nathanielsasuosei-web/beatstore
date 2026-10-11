"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, ShoppingBag } from "lucide-react";
import { usePlayer, type Track } from "@/components/player-provider";
import { formatMoney } from "@/lib/money";
import { cn, previewIsPlayable } from "@/lib/utils";
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
      <div className="border border-dashed border-ink-600 p-10 text-center">
        <p className="mono-sm text-ash-500">Nothing published yet</p>
        <p className="mt-2 text-sm text-ash-400">
          Upload your first beat from the admin dashboard.
        </p>
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
  const canPlay = previewIsPlayable(beat.previewFile);
  const popular = beat.licenses.find((l) => l.popular) ?? beat.licenses[0];

  return (
    <div className="reg-mark">
      <div className="border border-ink-700 bg-ink-850">
        {/* label strip */}
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2">
          <p className="mono-sm text-accent">Latest drop</p>
          <p className="mono-sm nums text-ash-500">{beat.plays.toLocaleString()} plays</p>
        </div>

        {/* cover */}
        <div className="relative aspect-square w-full overflow-hidden bg-ink-900">
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
            <div className="grid h-full place-items-center text-ink-600">No artwork</div>
          )}

          <button
            type="button"
            onClick={() => toggle(toTrack(beat), queue.map(toTrack))}
            disabled={!canPlay}
            title={canPlay ? undefined : "Preview coming soon"}
            className={cn(
              "absolute bottom-0 right-0 grid h-14 w-14 place-items-center border-l border-t border-ink-700 transition-colors duration-150",
              !canPlay
                ? "cursor-not-allowed bg-ink-950/80 text-ash-600"
                : isPlaying
                  ? "border-accent bg-accent text-ash-50"
                  : "bg-ink-950/85 text-ash-50 hover:bg-accent",
            )}
            aria-label={
              !canPlay ? "No preview available yet" : isPlaying ? "Pause preview" : "Play preview"
            }
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 translate-x-px" />
            )}
          </button>
        </div>

        {/* title block */}
        <div className="border-t border-ink-700 p-4">
          <Link href={`/beats/${beat.slug}`} className="block">
            <h2 className="headline text-xl text-ash-50 hover:text-accent-300">{beat.title}</h2>
          </Link>
          <p className="mono-sm nums mt-1 text-ash-500">
            {[beat.genre, beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink-700 pt-3">
            <div>
              <p className="mono-sm text-ash-500">{popular?.name ?? "Licence"}</p>
              <p className="headline nums text-lg text-accent-300">
                {formatMoney(popular?.price ?? 0)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggle(toTrack(beat), queue.map(toTrack))}
                disabled={!canPlay}
                className={cn("btn btn-secondary btn-sm", !canPlay && "opacity-40")}
              >
                {!canPlay ? "No preview" : isPlaying ? "Pause" : "Preview"}
              </button>
              <Link href={`/beats/${beat.slug}`} className="btn btn-primary btn-sm">
                <ShoppingBag className="h-3.5 w-3.5" />
                Licence
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* up next */}
      <div className="mt-px border border-ink-700 bg-ink-850">
        <p className="mono-sm border-b border-ink-700 px-4 py-2 text-ash-500">Up next</p>
        {queue.slice(0, 3).map((item, i) => {
          const active = isCurrent(item.slug) && playing;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(toTrack(item), queue.map(toTrack))}
              className="flex w-full items-center gap-3 border-b border-ink-700 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink-800"
            >
              <span className="mono-sm nums w-5 shrink-0 text-ash-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative h-9 w-9 shrink-0 overflow-hidden border border-ink-700 bg-ink-900">
                {item.coverImage ? (
                  <Image src={item.coverImage} alt="" fill sizes="36px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ash-100">{item.title}</span>
                <span className="mono-sm nums block text-ash-500">
                  {item.bpm ? `${item.bpm} BPM` : (item.genre ?? "—")}
                </span>
              </span>
              {active ? (
                <span className="eq text-accent">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <Play className="h-3.5 w-3.5 shrink-0 text-ash-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
