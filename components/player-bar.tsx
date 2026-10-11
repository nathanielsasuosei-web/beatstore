"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { formatClock, usePlayer } from "@/components/player-provider";

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
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700 bg-ink-950">
        {/* scrub track */}
        <div
          onClick={handleSeek}
          className="h-2.5 w-full cursor-pointer border-b border-ink-800 bg-ink-900"
          role="presentation"
        >
          <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
        </div>

        <div className="container-page flex items-center gap-4 py-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-ink-700 bg-ink-850">
            {current.coverImage ? (
              <Image src={current.coverImage} alt="" fill sizes="44px" className="object-cover" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Link
                href={`/beats/${current.slug}`}
                className="headline truncate text-sm text-ash-50 hover:text-accent-300"
              >
                {current.title}
              </Link>
              {playing && (
                <span className="eq text-accent" aria-hidden>
                  <span /> <span /> <span /> <span />
                </span>
              )}
            </div>
            <p className="mono-sm nums mt-0.5 truncate text-ash-500">
              {[
                current.genre,
                current.bpm ? `${current.bpm} BPM` : null,
                current.musicalKey,
                current.producer,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="mono-sm nums hidden shrink-0 text-ash-400 sm:block">
            {formatClock(progress)} <span className="text-ash-600">/</span> {formatClock(duration)}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={previous}
              className="btn btn-ghost btn-sm !px-2"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggle(current)}
              className="grid h-10 w-10 place-items-center border border-accent bg-accent text-ash-50 transition-colors hover:bg-accent-300 hover:border-accent-300"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-px" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              className="btn btn-ghost btn-sm !px-2"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <label htmlFor="player-volume" className="mono-sm text-ash-600">
              Vol
            </label>
            <input
              id="player-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none bg-ink-700 accent-accent"
              aria-label="Volume"
            />
          </div>

          <button
            type="button"
            onClick={stop}
            className="btn btn-ghost btn-sm shrink-0 !px-2"
            aria-label="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* keeps the fixed bar from covering the tail of the page */}
      <div aria-hidden className="h-[72px] shrink-0" />
    </>
  );
}
