import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { beatCounts } from "@/lib/data/catalog";
import { SectionHeading, Stat } from "@/components/section";

export const metadata: Metadata = {
  title: "About the studio",
  description: "Meet the producer behind the store, the gear, the workflow and the sound.",
};

const SERVICES = [
  {
    title: "Beat leasing & exclusive sales",
    text: "The full catalogue, licensed properly with paperwork you can show a distributor.",
  },
  {
    title: "Mixing & mastering",
    text: "Send your stems and get back a release-ready master for streaming and club play.",
  },
  {
    title: "Custom production",
    text: "Built from your reference — arrangement, tempo, instrumentation and a hook that fits your voice.",
  },
  {
    title: "Sync & commercial work",
    text: "Adverts, film and brand campaigns. Fixed quotes, cleared samples, clean paperwork.",
  },
];

const GEAR = [
  "Ableton Live 12 Suite",
  "FL Studio 21",
  "Universal Audio Apollo Twin",
  "Adam A7X monitors",
  "Yamaha HS8 (mix reference)",
  "Serum · Kontakt · Omnisphere",
  "Native Instruments Maschine",
  "Neumann TLM 103",
];

export default async function AboutPage() {
  const settings = await getSettings();
  const counts = beatCounts();

  return (
    <div className="container-page py-12">
      {/* ── masthead ──────────────────────────────────────────── */}
      <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
        <div>
          <p className="mono-sm text-accent">The studio</p>
          <h1 className="display mt-4 text-[clamp(2.2rem,6vw,3.75rem)] text-ash-50">
            {settings.producer_name}
          </h1>
          <p className="mono-sm mt-3 text-ash-500">Producer & mixing engineer · Accra</p>

          <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ash-300">
            {settings.bio}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ash-400">
            The rule in this studio is simple: if a beat can&apos;t carry a chorus on a phone
            speaker, it doesn&apos;t go in the store. Everything here is mixed, mastered and checked
            on three systems before it&apos;s published.
          </p>

          <div className="mt-10 grid gap-x-8 gap-y-6 border-t border-ink-700 pt-8 sm:grid-cols-3">
            <Stat
              label="Beats published"
              value={String(counts.published)}
              hint={`${counts.plays.toLocaleString()} preview plays`}
            />
            <Stat label="Turnaround" value="3–5 days" hint="Custom beats" />
            <Stat label="Based in" value="Accra, GH" hint="Working worldwide" />
          </div>
        </div>

        <figure className="reg-mark border border-ink-700 bg-ink-850 p-4">
          <div className="relative aspect-4/5 overflow-hidden bg-ink-900">
            <Image
              src="/studio.svg"
              alt="The studio setup"
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="border-t border-ink-700 px-1 py-4">
            <p className="mono-sm text-accent">Track record</p>
            <p className="mt-2 text-sm leading-relaxed text-ash-400">
              8 years producing · 400+ records placed with independent artists across West Africa
              and the diaspora.
            </p>
          </figcaption>
        </figure>
      </div>

      {/* ── services ──────────────────────────────────────────── */}
      <section className="mt-16">
        <SectionHeading index="01 — Services" title="What I do" />
        <ol className="mt-6 grid gap-x-10 border-t border-ink-700 sm:grid-cols-2">
          {SERVICES.map((service, i) => (
            <li
              key={service.title}
              className="flex gap-5 border-b border-ink-700 py-5 sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <span className="mono-sm nums shrink-0 text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="headline text-base text-ash-50">{service.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ash-400">{service.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── gear + process ────────────────────────────────────── */}
      <section className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mono-sm border-b border-ink-700 pb-2 text-ash-500">Studio setup</p>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {GEAR.map((item) => (
              <li key={item} className="border-b border-ink-800 py-2.5 text-sm text-ash-300">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-sm border-b border-ink-700 pb-2 text-ash-500">How we work</p>
          <ol className="mt-4">
            {[
              "You send references, tempo, key and your deadline.",
              "You get a quote and a delivery date the same day.",
              "Two rounds of revisions are included on custom work.",
              "Final files (WAV, MP3, stems) plus a licence PDF land in your inbox.",
              "Send the finished vocal and the mix gets polished free on premium+ licences.",
            ].map((step, index) => (
              <li
                key={step}
                className="flex gap-4 border-b border-ink-800 py-3 text-sm leading-relaxed text-ash-300"
              >
                <span className="mono-sm nums shrink-0 text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <Link href="/contact" className="btn btn-primary btn-sm mt-6">
            Start a project
          </Link>
        </div>
      </section>
    </div>
  );
}
