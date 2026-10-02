"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { formatClock, usePlayer } from "@/components/player-provider";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const {
    current,
    playing,
    progress,
    duration,
    volume,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    stop,
  } = usePlayer();

  if (!current) return null;

  const percent = duration > 0 ? (progress / duration) * 100 : 0;

  function handleSeek(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(Math.max(0, Math.min(1, ratio)) * (duration || 0));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 animate-fade-up border-t border-ink-700 bg-ink-950/95 backdrop-blur-xl">
      <div
        onClick={handleSeek}
        className="group h-1.5 w-full cursor-pointer bg-ink-800"
        role="presentation"
      >
        <div
          className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 transition-[width] duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="container-page flex items-center gap-3 py-2.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-800">
          {current.coverImage ? (
            <Image src={current.coverImage} alt="" fill sizes="44px" className="object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/beats/${current.slug}`} className="truncate text-sm font-semibold hover:text-lime-300">
              {current.title}
            </Link>
            {playing && (
              <span className="eq text-lime-400" aria-hidden>
                <span /> <span /> <span /> <span />
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-zinc-500">
            {[current.genre, current.bpm ? `${current.bpm} BPM` : null, current.musicalKey, current.producer]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
          <span>{formatClock(progress)}</span>
          <span>/</span>
          <span>{formatClock(duration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={previous} className="btn btn-ghost btn-sm" aria-label="Previous">
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggle(current)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full bg-lime-400 text-ink-950 transition hover:bg-lime-300"
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 translate-x-px" />}
          </button>
          <button type="button" onClick={next} className="btn btn-ghost btn-sm" aria-label="Next">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Volume2 className="h-4 w-4 text-zinc-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-ink-700 accent-lime-400"
            aria-label="Volume"
          />
        </div>

        <button type="button" onClick={stop} className="btn btn-ghost btn-sm" aria-label="Close player">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
