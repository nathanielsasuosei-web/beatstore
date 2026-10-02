import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Flame, Gauge, KeyRound, Music2, Play, Tag } from "lucide-react";
import { getBeatBySlug, listBeats } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import { BuyPanel } from "@/components/buy-panel";
import { BeatGrid } from "@/components/beat-card";
import { SectionHeading } from "@/components/section";
import { formatDuration, parseTags } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const beat = getBeatBySlug(slug);
  if (!beat) return { title: "Beat not found" };
  return {
    title: `${beat.title} — ${beat.genre ?? "beat"}${beat.bpm ? `, ${beat.bpm} BPM` : ""}`,
    description:
      beat.description ??
      `Buy ${beat.title} — ${beat.genre ?? "instrumental"} beat${beat.bpm ? ` at ${beat.bpm} BPM` : ""}. Instant delivery by email.`,
    openGraph: {
      title: beat.title,
      images: beat.coverImage ? [beat.coverImage] : undefined,
      description: beat.description ?? undefined,
    },
  };
}

export default async function BeatPage({ params }: Params) {
  const { slug } = await params;
  const beat = getBeatBySlug(slug);
  if (!beat) notFound();

  const settings = await getSettings();
  const { beats: allBeats } = listBeats({ limit: 40 });
  const related = allBeats.filter((b) => b.id !== beat.id && (b.genre === beat.genre || b.mood === beat.mood)).slice(0, 4);
  const fallbackRelated = allBeats.filter((b) => b.id !== beat.id).slice(0, 4);
  const suggestions = related.length ? related : fallbackRelated;

  const facts = [
    { icon: Gauge, label: "Tempo", value: beat.bpm ? `${beat.bpm} BPM` : "—" },
    { icon: KeyRound, label: "Key", value: beat.musicalKey ?? "—" },
    { icon: Music2, label: "Genre", value: beat.genre ?? "—" },
    { icon: Flame, label: "Mood", value: beat.mood ?? "—" },
  ];

  return (
    <div className="container-page py-10">
      <Link href="/beats" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-lime-300">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to all beats
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid gap-6 sm:grid-cols-[260px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-800">
              {beat.coverImage ? (
                <Image
                  src={beat.coverImage}
                  alt={`${beat.title} cover art`}
                  fill
                  priority
                  sizes="260px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {beat.genre && <span className="chip chip-accent">{beat.genre}</span>}
                {beat.mood && <span className="chip">{beat.mood}</span>}
                {!beat.published && <span className="chip">Unpublished</span>}
                {beat.featured && <span className="chip">Featured</span>}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{beat.title}</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Produced by {settings.producer_name} · {beat.plays.toLocaleString()} preview plays
                {beat.duration ? ` · ${formatDuration(beat.duration)}` : ""}
              </p>

              {beat.description && (
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{beat.description}</p>
              )}

              {parseTags(beat.tags).length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-zinc-500" />
                  {parseTags(beat.tags).map((tag) => (
                    <Link key={tag} href={`/beats?q=${encodeURIComponent(tag)}`} className="chip hover:border-ink-600">
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="surface-card p-4">
                <fact.icon className="h-4 w-4 text-lime-400" />
                <dt className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500">{fact.label}</dt>
                <dd className="text-sm font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="surface-card mt-6 p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Play className="h-4 w-4 text-lime-400" /> What you get after payment
            </h2>
            <ul className="mt-4 grid gap-2.5 text-sm text-zinc-300 sm:grid-cols-2">
              {[
                "Untagged audio files (MP3 / WAV / trackout by tier)",
                "A signed PDF licence agreement with your name on it",
                "Download links emailed instantly + saved in your dashboard",
                "Buyer support — reply to any email and the producer answers",
                "Free mix of your finished record on premium & exclusive tiers",
                "Payment receipts for your records",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card mt-6 p-5 text-sm leading-relaxed text-zinc-400">
            <h2 className="font-semibold text-zinc-200">Before you buy</h2>
            <p className="mt-2">
              Previews are watermarked with a producer tag. Buying removes the tag and delivers the full
              files. Beats are leased, never sold twice on an exclusive — if you buy exclusive rights the
              beat is taken off the store immediately.
            </p>
            <p className="mt-2">
              Want something custom in this lane?{" "}
              <Link href="/contact" className="link-accent">
                Send a custom beat request
              </Link>{" "}
              and the quote comes back within a day.
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyPanel beat={beat} producer={settings.producer_name} />
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="You might also like" eyebrow="Same lane" />
          <div className="mt-6">
            <BeatGrid beats={suggestions} />
          </div>
        </section>
      )}
    </div>
  );
}
