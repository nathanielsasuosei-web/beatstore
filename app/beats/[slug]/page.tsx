import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
      images: beat.coverImage
        ? [{ url: beat.coverImage, alt: `${beat.title} artwork` }]
        : undefined,
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
  const related = allBeats
    .filter((b) => b.id !== beat.id && (b.genre === beat.genre || b.mood === beat.mood))
    .slice(0, 4);
  const fallbackRelated = allBeats.filter((b) => b.id !== beat.id).slice(0, 4);
  const suggestions = related.length ? related : fallbackRelated;

  const facts = [
    { label: "Tempo", value: beat.bpm ? `${beat.bpm} BPM` : "—" },
    { label: "Key", value: beat.musicalKey ?? "—" },
    { label: "Genre", value: beat.genre ?? "—" },
    { label: "Mood", value: beat.mood ?? "—" },
  ];

  return (
    <div className="container-page py-10">
      <Link href="/beats" className="arrow-link">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to all beats
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div>
          <div className="grid gap-6 sm:grid-cols-[260px_1fr]">
            <div className="reg-mark relative aspect-square overflow-hidden border border-ink-700 bg-ink-850">
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
              <h1 className="display mt-4 text-4xl text-ash-50 sm:text-5xl">{beat.title}</h1>
              <p className="mono-sm nums mt-3 text-ash-500">
                {settings.producer_name} · {beat.plays.toLocaleString()} plays
                {beat.duration ? ` · ${formatDuration(beat.duration)}` : ""}
              </p>

              {beat.description && (
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ash-300">
                  {beat.description}
                </p>
              )}

              {parseTags(beat.tags).length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="mono-sm mr-1 text-ash-600">Tags</span>
                  {parseTags(beat.tags).map((tag) => (
                    <Link
                      key={tag}
                      href={`/beats?q=${encodeURIComponent(tag)}`}
                      className="chip transition-colors hover:border-accent hover:text-accent-300"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── spec table ─────────────────────────────────── */}
          <div className="mt-10 border-t border-ink-700 pt-4">
            <p className="mono-sm mb-3 text-accent">Specification</p>
            <dl className="grid grid-cols-2 gap-px sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="border-t border-ink-700 py-3 pr-4">
                  <dt className="mono-sm text-ash-500">{fact.label}</dt>
                  <dd className="headline nums mt-1.5 text-base text-ash-100">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── what you get ───────────────────────────────── */}
          <div className="mt-10 border-t border-ink-700 pt-4">
            <p className="mono-sm mb-3 text-accent">What arrives</p>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {[
                "Untagged audio — MP3, WAV or trackout by tier",
                "Signed PDF licence with your name on it",
                "Download links emailed instantly, kept in your dashboard",
                "Free mix of the finished record on premium and exclusive",
                "A receipt for your records",
                "The producer, reachable by reply",
              ].map((line) => (
                <li
                  key={line}
                  className="border-b border-ink-800 py-2.5 text-sm leading-relaxed text-ash-300"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* ── small print ────────────────────────────────── */}
          <div className="mt-8 border-l-2 border-accent bg-ink-850 px-5 py-4 text-sm leading-relaxed text-ash-400">
            <p className="mono-sm mb-2 text-ash-300">Before you buy</p>
            <p>
              Previews carry a producer tag. Buying removes it and delivers the clean files. Beats
              are leased, never sold twice — take the exclusive and the beat comes off the shelf the
              moment payment clears.
            </p>
            <p className="mt-2">
              Want something built in this lane?{" "}
              <Link href="/contact" className="link-accent">
                Send a custom request
              </Link>{" "}
              and a quote comes back within a day.
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyPanel beat={beat} producer={settings.producer_name} />
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="You might also like" index="Same lane" />
          <div className="mt-6">
            <BeatGrid beats={suggestions} />
          </div>
        </section>
      )}
    </div>
  );
}
