import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, CreditCard, Headphones, Mic, Music4, Smartphone, Wallet } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { getUserById } from "@/lib/data/users";
import { listServices } from "@/lib/data/bookings";
import { openingHoursTable } from "@/lib/booking";
import { formatMoney } from "@/lib/money";
import { StudioBooking } from "@/components/studio-booking";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Book studio time",
  description:
    "Recording, mixing and mastering sessions. Pick a slot, pay the deposit with mobile money and your confirmation is emailed instantly.",
};

const SERVICE_ICONS = [Mic, Music4, Headphones, CalendarClock];

export default async function StudioPage() {
  const sessionUser = await getCurrentUser();
  const [settings, user] = await Promise.all([
    getSettings(),
    sessionUser ? Promise.resolve(getUserById(sessionUser.id)) : Promise.resolve(null),
  ]);
  const services = listServices(true);
  const depositPercent = Math.min(Math.max(Number(settings.studio_deposit_percent) || 50, 0), 100);
  const serviceFeePercent = Math.min(Math.max(Number(settings.studio_service_fee_percent) || 0, 0), 50);
  const hours = openingHoursTable(settings);

  return (
    <div className="container-page py-12">
      {/* ── hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900/60 px-6 py-12 sm:px-10">
        <div
          className="pointer-events-none absolute -top-32 right-0 h-72 w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 65%)" }}
        />
        <div className="relative max-w-2xl">
          <span className="chip chip-accent">
            <CalendarClock className="h-3.5 w-3.5" /> Studio bookings · Accra, Ghana
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Book your session.</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">{settings.studio_tagline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="badge bg-ink-800 text-lime-300">{depositPercent}% deposit to lock a slot</span>
            <span className="badge bg-ink-800 text-zinc-300">Pay with MoMo · Telecel · AT · Card</span>
            <span className="badge bg-ink-800 text-zinc-300">Instant email confirmation</span>
          </div>
        </div>
      </section>

      {/* ── services ─────────────────────────────────────────── */}
      {services.length > 0 ? (
        <section className="mt-12">
          <SectionHeading
            eyebrow="What we can do for you"
            title="Pick a service"
            blurb={`Every session is priced per hour with a ${depositPercent}% deposit paid online to lock your slot. The balance is settled at the studio.`}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {services.map((service, index) => {
              const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
              return (
                <div key={service.id} className="surface-card flex flex-col p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{service.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{service.description}</p>
                  <p className="mt-4 text-2xl font-extrabold text-lime-300">
                    {formatMoney(service.pricePerHour, settings.currency)}
                    <span className="text-sm font-medium text-zinc-500"> / hour</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {service.minHours}–{service.maxHours} hrs per session · {depositPercent}% deposit
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── booking widget ───────────────────────────────────── */}
      {services.length > 0 ? (
        <section id="book" className="mt-12 scroll-mt-24">
          <SectionHeading
            eyebrow="Reserve your slot"
            title="Choose a date and time"
            blurb="Slots update live — greyed-out times are already taken."
          />
          <div className="mt-6">
            <StudioBooking
              services={services.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                pricePerHour: s.pricePerHour,
                minHours: s.minHours,
                maxHours: s.maxHours,
              }))}
              depositPercent={depositPercent}
              serviceFeePercent={serviceFeePercent}
              currency={settings.currency || "GHS"}
              user={user ? { name: user.name, email: user.email, phone: user.phone ?? null } : null}
            />
          </div>
        </section>
      ) : (
        <section className="mt-12">
          <div className="surface-card grid place-items-center gap-3 p-12 text-center">
            <Clock className="h-8 w-8 text-zinc-600" />
            <h3 className="text-lg font-semibold">Bookings are being set up</h3>
            <p className="max-w-md text-sm text-zinc-400">
              The producer hasn&apos;t published any studio services yet — check back soon or{" "}
              <Link href="/contact" className="text-lime-300 hover:underline">
                send a message
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* ── hours + policy ───────────────────────────────────── */}
      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Clock className="h-4.5 w-4.5 text-lime-400" /> Opening hours
          </h2>
          <ul className="mt-4 divide-y divide-ink-800 text-sm">
            {hours.map((row) => (
              <li key={row.day} className="flex items-center justify-between py-2.5">
                <span className="text-zinc-300">{row.day}</span>
                <span className={row.label === "Closed" ? "text-zinc-600" : "font-medium text-lime-300"}>
                  {row.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Wallet className="h-4.5 w-4.5 text-lime-400" /> Booking policy
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">{settings.studio_policy}</p>
          <div className="mt-5 grid gap-3 text-sm text-zinc-400">
            <p className="flex items-start gap-2.5">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
              Deposits can be paid with MTN MoMo, Telecel Cash, AirtelTigo Money or card — the {depositPercent}%
              deposit holds your slot the moment it lands.
            </p>
            <p className="flex items-start gap-2.5">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
              The remaining balance is paid at the studio before your session starts.
            </p>
          </div>
          <p className="mt-5 text-xs text-zinc-500">
            Questions? Call{" "}
            <a href={`tel:${settings.support_phone.replace(/\s/g, "")}`} className="text-lime-300 hover:underline">
              {settings.support_phone}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${settings.support_email}`} className="text-lime-300 hover:underline">
              {settings.support_email}
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
