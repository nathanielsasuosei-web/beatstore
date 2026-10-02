import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, Coffee, Headphones, Mic2, Radio, SlidersHorizontal } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { beatCounts } from "@/lib/data/catalog";
import { SectionHeading, Stat } from "@/components/section";

export const metadata: Metadata = {
  title: "About the studio",
  description: "Meet the producer behind the store, the gear, the workflow and the sound.",
};

const SERVICES = [
  {
    icon: Headphones,
    title: "Beat leasing & exclusive sales",
    text: "The full catalogue, licensed properly with paperwork you can show a distributor.",
  },
  {
    icon: SlidersHorizontal,
    title: "Mixing & mastering",
    text: "Send your stems and get back a release-ready master for streaming and club play.",
  },
  {
    icon: Mic2,
    title: "Custom production",
    text: "Built from your reference — arrangement, tempo, instrumentation and a hook that fits your voice.",
  },
  {
    icon: Radio,
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
      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <SectionHeading
            eyebrow="The studio"
            title={`${settings.producer_name} — producer & mixing engineer`}
          />
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{settings.bio}</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            The rule in this studio is simple: if a beat can&apos;t carry a chorus on a phone speaker, it
            doesn&apos;t go in the store. Everything you hear here is mixed, mastered and checked on three
            systems before it&apos;s published.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Beats published" value={String(counts.published)} hint={`${counts.plays.toLocaleString()} preview plays`} />
            <Stat label="Turnaround" value="3–5 days" hint="Custom beats" />
            <Stat label="Based in" value="Accra, GH" hint="Working worldwide" />
          </div>
        </div>

        <div className="surface-card relative overflow-hidden p-4">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-ink-800">
            <Image
              src="/studio.svg"
              alt="The studio setup"
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex items-center gap-3 px-2 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300">
              <Award className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-400">
              8 years producing · 400+ records placed with independent artists across West Africa and the
              diaspora.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <SectionHeading eyebrow="What I do" title="Services" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <div key={service.title} className="surface-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300">
                <service.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{service.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-lime-400" /> Studio setup
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
            {GEAR.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Coffee className="h-4 w-4 text-lime-400" /> How we work
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-zinc-300">
            {[
              "You send references, tempo, key and your deadline.",
              "You get a quote and a delivery date the same day.",
              "Two rounds of revisions are included on custom work.",
              "Final files (WAV, MP3, stems) plus a licence PDF land in your inbox.",
              "Send the finished vocal and the mix gets polished free on premium+ licences.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime-400 text-[11px] font-bold text-ink-950">
                  {index + 1}
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
