import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Banknote, Clock, Mail, Play, Smartphone, Sparkles, Zap } from "lucide-react";
import { listBeats, listVideos } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import { BeatGrid } from "@/components/beat-card";
import { HeroPlayer } from "@/components/hero-player";
import { SectionHeading, Stat } from "@/components/section";
import { TIER_META } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

export default async function HomePage() {
  const settings = await getSettings();
  const { beats } = listBeats({ limit: 8 });
  const featured = beats.filter((b) => b.featured).slice(0, 4);
  const showcase = (featured.length ? featured : beats).slice(0, 4);
  const hero = beats[0];
  const videos = listVideos().slice(0, 3);
  const totalPlays = beats.reduce((sum, b) => sum + b.plays, 0);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink-700">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 65%)" }}
        />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="chip chip-accent">
              <Sparkles className="h-3.5 w-3.5" /> {settings.announcement}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Beats that are ready the moment
              <span className="bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
                {" "}
                you are.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              {settings.tagline} Browse, listen, pay with mobile money or bank transfer, and the
              files land in your inbox immediately — licence PDF included.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/beats" className="btn btn-primary btn-lg">
                Browse beats <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/licensing" className="btn btn-secondary btn-lg">
                How licensing works
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                { label: "Beats online", value: `${beats.length}` },
                { label: "Preview plays", value: totalPlays.toLocaleString() },
                { label: "Delivery", value: "Instant" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs uppercase tracking-widest text-zinc-500">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroPlayer beat={hero} queue={showcase} producer={settings.producer_name} />
        </div>
      </section>

      {/* ── featured beats ───────────────────────────────────── */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Fresh off the MPC"
          title="Featured beats"
          blurb="Every beat is mixed and mastered, available as MP3, WAV or full trackout depending on the licence you pick."
          action={{ href: "/beats", label: "All beats" }}
        />
        <div className="mt-8">
          <BeatGrid beats={showcase} />
        </div>
      </section>

      {/* ── how it works ─────────────────────────────────────── */}
      <section className="border-y border-ink-700 bg-ink-950">
        <div className="container-page py-16">
          <SectionHeading
            eyebrow="From preview to release"
            title="Buying a beat takes about a minute"
            blurb="No back-and-forth DMs. Pick a licence, pay how you like, get everything by email."
          />
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              {
                icon: Play,
                title: "1. Listen",
                text: "Stream the preview right here. Every beat has tagged previews so you hear exactly what you're buying.",
              },
              {
                icon: Smartphone,
                title: "2. Pay your way",
                text: "MTN MoMo, Telecel Cash, AT Money, card or bank transfer. The checkout builds your order reference automatically.",
              },
              {
                icon: Zap,
                title: "3. Instant delivery",
                text: "Online payments release the files straight away. MoMo and bank transfers are verified by hand — usually within the hour.",
              },
              {
                icon: Mail,
                title: "4. Emails that keep",
                text: "Downloads and your signed licence PDF arrive by email, and stay in your artist dashboard for 30 days.",
              },
            ].map((step) => (
              <li key={step.title} className="surface-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Mobile money" value="MTN · Telecel · AT" hint="Instant or verified same day" />
            <Stat label="Bank transfer" value={settings.bank_name} hint={settings.bank_account_name} />
            <Stat label="Card" value="Visa · Mastercard" hint="Secured by Paystack" />
          </div>
        </div>
      </section>

      {/* ── licences ─────────────────────────────────────────── */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Simple, written in plain English"
          title="Choose the licence that matches your release"
          blurb="Every purchase generates a signed licence agreement PDF with your name and the beat details on it."
          action={{ href: "/licensing", label: "Licence details" }}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {Object.entries(TIER_META).map(([tier, meta], index) => (
            <div
              key={tier}
              className={`surface-card relative p-6 ${
                index === 1 ? "border-lime-400/40 ring-1 ring-lime-400/20" : ""
              }`}
            >
              {index === 1 && (
                <span className="badge absolute -top-3 left-6 bg-lime-400 text-ink-950">Most popular</span>
              )}
              <h3 className="text-lg font-bold">{meta.label}</h3>
              <p className="mt-2 text-2xl font-extrabold text-lime-300">
                {formatMoney(meta.defaultPrice)}
                <span className="ml-1 text-xs font-medium text-zinc-500">starting price</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{meta.blurb}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                {[
                  `Files: ${meta.files}`,
                  tier === "exclusive" ? "Beat removed from the store" : "Non-exclusive — beats stay on sale",
                  tier === "basic" ? "Up to 10,000 streams" : "Unlimited streams",
                  tier === "exclusive" ? "Free mix + master included" : "Producer credit required",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── videos ───────────────────────────────────────────── */}
      {videos.length > 0 && (
        <section className="border-y border-ink-700 bg-ink-950">
          <div className="container-page py-16">
            <SectionHeading
              eyebrow="Behind the beats"
              title="Studio sessions & visuals"
              action={{ href: "/videos", label: "All videos" }}
            />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href="/videos"
                  className="group surface-card overflow-hidden transition hover:border-ink-600"
                >
                  <div className="relative aspect-video bg-ink-800">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 380px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <span className="absolute inset-0 grid place-items-center bg-ink-950/40">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-400 text-ink-950">
                        <Play className="h-5 w-5 translate-x-px" />
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold group-hover:text-lime-300">{video.title}</h3>
                    {video.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                        {video.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── about ────────────────────────────────────────────── */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="The producer" title={settings.producer_name} />
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-zinc-400">{settings.bio}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary btn-sm">
                Request a custom beat
              </Link>
              <Link href="/about" className="btn btn-secondary btn-sm">
                More about the studio
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Based in" value="Accra, Ghana" hint="Working with artists worldwide" />
            <Stat label="Genres" value="Afrobeats · Drill" hint="Amapiano, highlife, R&B, trap" />
            <Stat label="Turnaround" value="3–5 days" hint="Custom beats, rush available" />
            <Stat label="Contact" value={settings.support_phone} hint={settings.support_email} />
          </div>
        </div>
      </section>

      {/* ── closing CTA ──────────────────────────────────────── */}
      <section className="container-page pb-4">
        <div className="surface-card relative overflow-hidden p-8 text-center sm:p-12">
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-24 h-56 opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 70%)" }}
          />
          <Clock className="mx-auto h-6 w-6 text-lime-400" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Your next single is one licence away
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Create a free artist account to keep every download, licence and receipt in one place —
            or check out as a guest and still get everything by email.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/beats" className="btn btn-primary btn-lg">
              Start listening
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg">
              Create artist account
            </Link>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Banknote className="h-3.5 w-3.5" /> Mobile money · Bank transfer · Card
          </p>
        </div>
      </section>
    </>
  );
}
