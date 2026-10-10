import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { listBeats, listVideos } from "@/lib/data/catalog";
import { listServices } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { BeatGrid } from "@/components/beat-card";
import { HeroPlayer } from "@/components/hero-player";
import { SectionHeading, Stat } from "@/components/section";
import { TIER_META } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

export default async function HomePage() {
  const settings = await getSettings();
  const { beats, total } = listBeats({ limit: 8 });
  const featured = beats.filter((b) => b.featured).slice(0, 4);
  const showcase = (featured.length ? featured : beats).slice(0, 4);
  const hero = beats[0];
  const videos = listVideos().slice(0, 3);
  const services = listServices(true).slice(0, 3);
  const depositPercent = Math.min(Math.max(Number(settings.studio_deposit_percent) || 50, 0), 100);
  const totalPlays = beats.reduce((sum, b) => sum + b.plays, 0);
  const tiers = Object.entries(TIER_META);

  return (
    <>
      {/* ── masthead ───────────────────────────────────────── */}
      <section className="border-b border-ink-700">
        <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div className="flex flex-col justify-between">
            <div>
              <p className="mono-sm text-accent">{settings.announcement}</p>
              <h1 className="display mt-5 text-[clamp(2.6rem,7vw,4.75rem)] text-ash-50">
                Beats that already
                <br />
                sound like records
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ash-300">
                {settings.tagline} Every instrumental here is mixed and mastered before it goes on
                sale — so you are mixing a vocal, not fixing a kick drum.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/beats" className="btn btn-primary btn-lg">
                Browse the catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/studio" className="btn btn-secondary btn-lg">
                Book studio time
              </Link>
            </div>
          </div>

          <HeroPlayer beat={hero} queue={showcase} producer={settings.producer_name} />
        </div>

        {/* facts strip */}
        <div className="container-page grid grid-cols-2 gap-px border-t border-ink-700 md:grid-cols-4">
          {[
            { label: "Beats online", value: String(total) },
            { label: "Preview plays", value: totalPlays.toLocaleString() },
            { label: "Delivery", value: "Instant" },
            { label: "Licence", value: "Signed PDF" },
          ].map((item) => (
            <div key={item.label} className="border-t border-ink-700 py-4 md:border-t-0">
              <p className="mono-sm text-ash-500">{item.label}</p>
              <p className="display nums mt-1.5 text-2xl text-ash-50">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 01 · featured ──────────────────────────────────── */}
      <section className="container-page py-16">
        <SectionHeading
          index="01 — Featured"
          title="Fresh off the boards"
          blurb="Every beat ships as MP3, WAV or full trackout, depending on the licence you pick. Previews are tagged — what you hear is what lands in your inbox."
          action={{ href: "/beats", label: "All beats" }}
        />
        <div className="mt-10">
          <BeatGrid beats={showcase} />
        </div>
      </section>

      {/* ── 02 · how it works — inverted ───────────────────── */}
      <section className="paper-block">
        <div className="container-page py-16">
          <SectionHeading
            index="02 — Process"
            title="Four steps, about a minute"
            blurb="No DMs, no waiting on a reply. Pick a licence, pay how you like, and the files are on their way."
          />
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Listen",
                text: "Stream the preview here. They are tagged on purpose, so you are hearing the actual mix rather than a rough idea of it.",
              },
              {
                title: "Choose a licence",
                text: "Basic for demos and mixtapes, Premium for streaming releases, Exclusive if you want it taken off the shelf.",
              },
              {
                title: "Pay your way",
                text: "MTN MoMo, Telecel Cash, AT Money, card or bank transfer. The checkout writes your order reference for you.",
              },
              {
                title: "Download",
                text: "Online payments unlock the files immediately. MoMo and transfers get checked by hand — usually within the hour.",
              },
            ].map((step, i) => (
              <li key={step.title} className="border-t border-ink-950/25 pt-3">
                <span className="display block text-4xl text-accent-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="headline mt-3 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-x-8 gap-y-6 border-t border-ink-950/20 pt-8 sm:grid-cols-3">
            <Stat
              label="Mobile money"
              value="MTN · Telecel · AT"
              hint="Instant or verified same day"
            />
            <Stat
              label="Bank transfer"
              value={settings.bank_name}
              hint={settings.bank_account_name}
            />
            <Stat label="Card" value="Visa · Mastercard" hint="Secured by Paystack" />
          </div>
        </div>
      </section>

      {/* ── 03 · licences ──────────────────────────────────── */}
      <section className="container-page py-16">
        <SectionHeading
          index="03 — Licensing"
          title="Three ways to own it"
          blurb="Every order generates a signed licence PDF with your name and the beat details on it. The terms are written to be read, not skimmed past."
          action={{ href: "/licensing", label: "Full terms" }}
        />

        <div className="mt-8 -mx-5 overflow-x-auto px-5">
          <table className="table-clean min-w-[680px]">
            <thead>
              <tr>
                <th className="w-[28%]">&nbsp;</th>
                {tiers.map(([tier, meta], i) => (
                  <th key={tier} className={i === 1 ? "text-accent" : undefined} scope="col">
                    {meta.label}
                    {i === 1 && <span className="ml-2 normal-case text-ash-600">(most taken)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono-sm text-ash-500">From</td>
                {tiers.map(([tier, meta], i) => (
                  <td
                    key={tier}
                    className={`headline nums text-lg ${i === 1 ? "text-accent-300" : "text-ash-100"}`}
                  >
                    {formatMoney(meta.defaultPrice)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="mono-sm text-ash-500">Files</td>
                {tiers.map(([tier, meta]) => (
                  <td key={tier} className="text-ash-200">
                    {meta.files}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="mono-sm text-ash-500">Good for</td>
                <td className="text-ash-300">{TIER_META.basic.blurb}</td>
                <td className="text-ash-300">{TIER_META.premium.blurb}</td>
                <td className="text-ash-300">{TIER_META.exclusive.blurb}</td>
              </tr>
              <tr>
                <td className="mono-sm text-ash-500">Streams</td>
                <td className="text-ash-300">Up to 10,000</td>
                <td className="text-ash-300">Unlimited</td>
                <td className="text-ash-300">Unlimited</td>
              </tr>
              <tr>
                <td className="mono-sm text-ash-500">Stays on sale</td>
                <td className="text-ash-300">Yes</td>
                <td className="text-ash-300">Yes</td>
                <td className="text-accent-300">Removed</td>
              </tr>
              <tr>
                <td className="mono-sm text-ash-500">Producer credit</td>
                <td className="text-ash-300">Required</td>
                <td className="text-ash-300">Required</td>
                <td className="text-ash-300">Required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 04 · studio — inverted ─────────────────────────── */}
      {services.length > 0 && (
        <section className="paper-block">
          <div className="container-page py-16">
            <SectionHeading
              index="04 — Studio"
              title="Book the room"
              blurb={`Recording, mixing and mastering in a treated room, with the producer behind the boards. Reserve a slot with a ${depositPercent}% deposit and settle the balance on the day.`}
              action={{ href: "/studio", label: "Pick a slot" }}
            />
            <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
              {services.map((service, index) => (
                <div key={service.id} className="border-t border-ink-950/25 pt-3">
                  <span className="mono-sm nums text-accent-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="headline mt-2 text-xl">{service.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{service.description}</p>
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="headline nums text-xl text-accent-500">
                      {formatMoney(service.pricePerHour, settings.currency)}
                    </span>
                    <span className="mono-sm text-ink-600">/ hour</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 05 · videos ────────────────────────────────────── */}
      {videos.length > 0 && (
        <section className="container-page py-16">
          <SectionHeading
            index="05 — Sessions"
            title="Behind the beats"
            blurb="Studio clips, session footage and finished visuals."
            action={{ href: "/videos", label: "All videos" }}
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {videos.map((video, i) => (
              <Link key={video.id} href="/videos" className="group block">
                <div className="relative aspect-video overflow-hidden border border-ink-700 bg-ink-850 transition-colors group-hover:border-accent">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 380px"
                      className="object-cover transition-[filter] duration-150 group-hover:contrast-125"
                    />
                  ) : null}
                  <span className="absolute bottom-0 left-0 grid h-10 w-10 place-items-center border-r border-t border-ink-700 bg-ink-950/85 text-ash-50 transition-colors group-hover:bg-accent">
                    <Play className="h-3.5 w-3.5 translate-x-px" />
                  </span>
                  <span className="mono-sm nums absolute right-0 top-0 bg-ink-950/85 px-2 py-1 text-ash-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="headline mt-3 text-sm text-ash-100 group-hover:text-accent-300">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ash-400">
                    {video.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 06 · producer ──────────────────────────────────── */}
      <section className="border-t border-ink-700">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading index="06 — Producer" title={settings.producer_name} />
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ash-300">
              {settings.bio}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary btn-sm">
                Request a custom beat
              </Link>
              <Link href="/about" className="btn btn-secondary btn-sm">
                More about the studio
              </Link>
            </div>
          </div>

          <div>
            <blockquote className="border-l-2 border-accent pl-5">
              <p className="font-serif text-2xl italic leading-snug text-ash-100">
                &ldquo;A beat is finished when the artist stops thinking about the drums and starts
                writing.&rdquo;
              </p>
              <footer className="mono-sm mt-3 text-ash-500">— {settings.producer_name}</footer>
            </blockquote>

            <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <Stat label="Based in" value="Accra, GH" hint="Working with artists worldwide" />
              <Stat label="Genres" value="Afro · Drill" hint="Amapiano, highlife, R&B, trap" />
              <Stat label="Turnaround" value="3–5 days" hint="Custom beats, rush available" />
              <Stat label="Contact" value={settings.support_phone} hint={settings.support_email} />
            </div>
          </div>
        </div>
      </section>

      {/* ── closing ───────────────────────────────────────── */}
      <section className="border-t border-ink-700 bg-ink-950">
        <div className="container-page py-16 text-center">
          <p className="mono-sm text-accent">Start here</p>
          <h2 className="display mt-4 text-[clamp(2rem,6vw,3.5rem)] text-ash-50">
            Pick a beat.
            <br />
            Leave with a song.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/beats" className="btn btn-primary btn-lg">
              Start listening
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg">
              Create artist account
            </Link>
          </div>
          <p className="mono-sm mt-6 text-ash-600">
            Mobile money · Bank transfer · Card — free account keeps every licence in one place
          </p>
        </div>
      </section>
    </>
  );
}
