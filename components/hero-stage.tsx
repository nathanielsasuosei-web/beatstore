"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Mail, Pause, Play, Smartphone } from "lucide-react";
import { usePlayer, type Track } from "@/components/player-provider";
import { CountUp } from "@/components/count-up";
import type { BeatCardData } from "@/components/beat-card";
import { formatMoney } from "@/lib/money";
import { cn, cssVars, previewIsPlayable } from "@/lib/utils";

export type HeroStat = {
  label: string;
  /** Omit to render `display` as plain text instead of counting up. */
  value?: number;
  display?: string;
  suffix?: string;
  hint: string;
};

export function HeroStage({
  settings,
  beat,
  queue,
  genres,
  stats,
}: {
  settings: Record<string, string>;
  beat: BeatCardData | null;
  queue: BeatCardData[];
  genres: string[];
  stats: HeroStat[];
}) {
  const { toggle, isCurrent, playing } = usePlayer();
  const sectionRef = useRef<HTMLElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [parallax, setParallax] = useState(0);

  const words = genres.length ? genres : ["Afrobeats", "Drill", "Amapiano"];

  /* pointer spotlight — follows the cursor across the hero */
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    let frame = 0;
    let x = 50;
    let y = 28;
    const apply = () => {
      frame = 0;
      node.style.setProperty("--px", `${x.toFixed(2)}%`);
      node.style.setProperty("--py", `${y.toFixed(2)}%`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = node.getBoundingClientRect();
      x = ((event.clientX - box.left) / Math.max(box.width, 1)) * 100;
      y = ((event.clientY - box.top) / Math.max(box.height, 1)) * 100;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    node.addEventListener("pointermove", onMove);
    return () => {
      node.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* the rotating genre word */
  useEffect(() => {
    const scale = Number(
      getComputedStyle(document.documentElement).getPropertyValue("--motion-scale") || "1",
    );
    if (scale < 0.05) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setWordIndex((index) => (index + 1) % words.length), 2600);
    return () => window.clearInterval(timer);
  }, [words.length]);

  /* gentle parallax on the hero art as the page moves */
  useEffect(() => {
    const scale = Number(
      getComputedStyle(document.documentElement).getPropertyValue("--motion-scale") || "1",
    );
    if (scale < 0.05) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      setParallax(Math.min(window.scrollY, 600) * 0.06);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const toTrack = (item: BeatCardData): Track => ({
    slug: item.slug,
    title: item.title,
    coverImage: item.coverImage,
    previewFile: item.previewFile,
    bpm: item.bpm,
    musicalKey: item.musicalKey,
    genre: item.genre,
    producer: settings.producer_name,
  });

  const trackQueue = queue.map(toTrack);
  const isPlaying = beat ? isCurrent(beat.slug) && playing : false;
  const canPlay = beat ? previewIsPlayable(beat.previewFile) : false;
  const popular = beat?.licenses.find((licence) => licence.popular) ?? beat?.licenses[0];
  const word = words[wordIndex % words.length];

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-b border-ink-700"
      style={cssVars({ "--px": "50%", "--py": "28%" })}
    >
      {/* ── atmosphere ──────────────────────────────────────── */}
      <div className="aurora" aria-hidden>
        <span className="aurora-blob loop-drift" style={{ animationDelay: "-2s" }} />
        <span className="aurora-blob loop-drift" style={{ animationDelay: "-9s" }} />
        <span className="aurora-blob loop-drift" style={{ animationDelay: "-16s" }} />
      </div>
      <div className="hero-grid" aria-hidden />
      <div className="hero-spot" aria-hidden />

      <div className="container-page relative grid gap-14 py-14 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:py-24">
        {/* ── the pitch ─────────────────────────────────────── */}
        <div className="flex flex-col justify-center">
          <p className="fade-in flex items-center gap-2.5" style={cssVars({ "--d": "60ms" })}>
            <span className="live-dot" aria-hidden />
            <span className="mono-sm text-accent">{settings.announcement}</span>
          </p>

          <h1 className="display mt-6 text-[clamp(2.6rem,7.4vw,5rem)] text-ash-50">
            <span className="mask-line">
              <span style={cssVars({ "--d": "120ms" })}>Beats that already</span>
            </span>
            <span className="mask-line">
              <span style={cssVars({ "--d": "240ms" })}>sound like records</span>
            </span>
            <span className="mask-line">
              {/* the genre rotates — the last word is the only colourful one */}
              <span style={cssVars({ "--d": "360ms" })} className="text-gradient word-swap">
                <span key={word}>{word}</span>
              </span>
            </span>
          </h1>

          <p
            className="rise mt-7 max-w-xl text-[15px] leading-relaxed text-ash-300"
            style={cssVars({ "--d": "460ms" })}
          >
            {settings.tagline} Every instrumental here is mixed and mastered before it goes on sale
            — so you are mixing a vocal, not fixing a kick drum.
          </p>

          <div
            className="rise mt-8 flex flex-wrap gap-3"
            style={cssVars({ "--d": "560ms" })}
          >
            <Link href="/beats" className="btn btn-primary btn-lg sheen group">
              Browse the catalogue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/studio" className="btn btn-secondary btn-lg hover-lift">
              Book studio time
            </Link>
          </div>

          {/* what the buyer gets — three promises */}
          <ul className="stagger mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { icon: BadgeCheck, text: "Signed licence PDF" },
              { icon: Mail, text: "Files emailed instantly" },
              { icon: Smartphone, text: "MoMo · Bank · Card" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2 text-xs text-ash-400">
                <item.icon className="h-3.5 w-3.5 text-accent" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── the deck: cover on a spinning record ───────────── */}
        <div className="blur-in relative" style={{ transform: `translateY(${-parallax}px)` }}>
          <HeroDeck
            beat={beat}
            queue={queue}
            popularPrice={popular?.price ?? 0}
            popularName={popular?.name ?? "Licence"}
            currency={settings.currency || "GHS"}
            playing={isPlaying}
            canPlay={canPlay}
            onToggle={() => beat && toggle(toTrack(beat), trackQueue)}
            onPlayIndex={(index) => toggle(trackQueue[index], trackQueue)}
            timeline={settings.delivery_note}
          />
        </div>
      </div>

      {/* ── facts strip, counting up ────────────────────────── */}
      <div className="container-page relative grid grid-cols-2 gap-px border-t border-ink-700 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="rise-sm border-t border-ink-700 py-5 md:border-t-0"
            style={cssVars({ "--d": `${640 + index * 90}ms` })}
          >
            <p className="mono-sm text-ash-500">{stat.label}</p>
            <p className="display nums mt-1.5 text-2xl text-ash-50 sm:text-3xl">
              {typeof stat.value === "number" ? (
                <CountUp value={stat.value} delay={index * 90} className="nums-glow" />
              ) : (
                <span className="nums-glow">{stat.display}</span>
              )}
              {stat.suffix}
            </p>
            <p className="mono-sm mt-1 text-ash-600">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="container-page relative hidden justify-center pb-6 pt-2 lg:flex">
        <span className="scroll-cue" aria-hidden />
      </div>
    </section>
  );
}

/* ── the hero deck ─────────────────────────────────────────── */

function HeroDeck({
  beat,
  queue,
  popularPrice,
  popularName,
  currency,
  playing,
  canPlay,
  onToggle,
  onPlayIndex,
  timeline,
}: {
  beat: BeatCardData | null;
  queue: BeatCardData[];
  popularPrice: number;
  popularName: string;
  currency: string;
  playing: boolean;
  canPlay: boolean;
  onToggle: () => void;
  onPlayIndex: (index: number) => void;
  timeline: string;
}) {
  const { isCurrent, playing: transportPlaying, toggle: toggleTrack } = usePlayer();
  const toTrackLocal = (item: BeatCardData): Track => ({
    slug: item.slug,
    title: item.title,
    coverImage: item.coverImage,
    previewFile: item.previewFile,
    bpm: item.bpm,
    musicalKey: item.musicalKey,
    genre: item.genre,
  });

  if (!beat) {
    return (
      <div className="glass grid h-full min-h-[26rem] place-items-center p-10 text-center">
        <div>
          <p className="mono-sm text-ash-500">Nothing published yet</p>
          <p className="mt-2 text-sm text-ash-400">
            Upload your first beat from the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden" style={{ borderRadius: "var(--radius-card)" }}>
      {/* label strip */}
      <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-2.5">
        <p className="mono-sm flex items-center gap-2 text-accent">
          <span className="live-dot" aria-hidden />
          Latest drop
        </p>
        <p className="mono-sm nums text-ash-500">{beat.plays.toLocaleString()} plays</p>
      </div>

      <div className="flex flex-col gap-5 p-2 sm:gap-6 sm:p-5 md:flex-row md:items-center">
        {/* the record */}
        <div className="relative mx-auto w-full max-w-[15rem] shrink-0 md:mx-0 md:w-40 lg:w-44">
          <div className="vinyl" data-playing={playing}>
            <div className="vinyl-disc relative aspect-square overflow-hidden rounded-full bg-ink-900">
              {beat.coverImage ? (
                <Image
                  src={beat.coverImage}
                  alt={`${beat.title} artwork`}
                  fill
                  priority
                  sizes="(max-width: 768px) 240px, 180px"
                  className="object-cover"
                />
              ) : null}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "repeating-radial-gradient(circle at 50% 50%, transparent 0 4px, hsl(0 0% 0% / 0.28) 4px 5px)",
                }}
                aria-hidden
              />
              <span
                className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-700/70 bg-ink-950/70"
                aria-hidden
              />
            </div>
          </div>

          {/* play control sits on the record's edge */}
          <button
            type="button"
            onClick={onToggle}
            disabled={!canPlay}
            aria-label={
              !canPlay ? "No preview available yet" : playing ? "Pause preview" : "Play preview"
            }
            title={canPlay ? undefined : "Preview coming soon"}
            className={cn(
              "absolute -bottom-1 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center border transition-all duration-300",
              !canPlay
                ? "cursor-not-allowed border-ink-700 bg-ink-950/85 text-ash-600"
                : playing
                  ? "border-accent bg-accent text-ash-50"
                  : "border-ink-600 bg-ink-950/90 text-ash-50 hover:border-accent hover:bg-accent",
            )}
            style={{ borderRadius: "50%" }}
          >
            {playing ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 translate-x-px" />}
          </button>
        </div>

        {/* track facts + transport */}
        <div className="min-w-0 flex-1">
          <Link href={`/beats/${beat.slug}`} className="block">
            <h2 className="headline text-xl text-ash-50 transition-colors hover:text-accent-300 sm:text-2xl">
              {beat.title}
            </h2>
          </Link>
          <p className="mono-sm nums mt-1.5 text-ash-500">
            {[beat.genre, beat.bpm ? `${beat.bpm} BPM` : null, beat.musicalKey, beat.mood]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {/* visualiser — animates only while this track plays */}
          <div className="mt-4 h-10 text-accent-400" aria-hidden>
            <span className="vis" data-playing={playing}>
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} className="h-full" />
              ))}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-ink-700/60 pt-3.5">
            <div>
              <p className="mono-sm text-ash-500">{popularName}</p>
              <p className="headline nums text-lg text-accent-300">
                {formatMoney(popularPrice, currency)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onToggle}
                disabled={!canPlay}
                className={cn("btn btn-secondary btn-sm", !canPlay && "opacity-40")}
              >
                {!canPlay ? "No preview" : playing ? "Pause" : "Preview"}
              </button>
              <Link href={`/beats/${beat.slug}`} className="btn btn-primary btn-sm sheen">
                Buy licence
              </Link>
            </div>
          </div>

          <p className="mono-sm mt-3 text-ash-600">{timeline}</p>
        </div>
      </div>

      {/* up next */}
      {queue.length > 0 && (
        <div className="border-t border-ink-700/60">
          <p className="mono-sm px-4 py-2 text-ash-500">Up next</p>
          <ul>
            {queue.slice(0, 3).map((item, index) => {
              const active = transportPlaying && isCurrent(item.slug);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      active ? toggleTrack(toTrackLocal(item), queue.map(toTrackLocal)) : onPlayIndex(index)
                    }
                    className="group flex w-full items-center gap-3 border-t border-ink-700/40 px-4 py-2.5 text-left transition-colors hover:bg-accent/8"
                  >
                    <span className="mono-sm nums w-5 shrink-0 text-ash-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden border border-ink-700 bg-ink-900">
                      {item.coverImage ? (
                        <Image src={item.coverImage} alt="" fill sizes="36px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ash-100 transition-colors group-hover:text-accent-200">
                        {item.title}
                      </span>
                      <span className="mono-sm nums block text-ash-500">
                        {item.bpm ? `${item.bpm} BPM` : (item.genre ?? "—")}
                      </span>
                    </span>
                    <span className="flex h-4 items-end text-accent" aria-hidden>
                      <span className="vis" data-playing={active}>
                        {Array.from({ length: 4 }).map((_, bar) => (
                          <span key={bar} className="h-full" />
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
