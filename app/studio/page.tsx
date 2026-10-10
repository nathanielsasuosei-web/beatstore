import type { Metadata } from "next";
import Link from "next/link";
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

export default async function StudioPage() {
  const sessionUser = await getCurrentUser();
  const [settings, user] = await Promise.all([
    getSettings(),
    sessionUser ? Promise.resolve(getUserById(sessionUser.id)) : Promise.resolve(null),
  ]);
  const services = listServices(true);
  const depositPercent = Math.min(Math.max(Number(settings.studio_deposit_percent) || 50, 0), 100);
  const serviceFeePercent = Math.min(
    Math.max(Number(settings.studio_service_fee_percent) || 0, 0),
    50,
  );
  const hours = openingHoursTable(settings);

  return (
    <div className="container-page py-12">
      {/* ── masthead ──────────────────────────────────────────── */}
      <section className="border-b border-ink-700 pb-10 pt-4">
        <p className="mono-sm text-accent">Studio bookings · Accra, Ghana</p>
        <h1 className="display mt-4 text-[clamp(2.5rem,8vw,5rem)] text-ash-50">Book the room.</h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ash-300">
          {settings.studio_tagline}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="mono-sm text-accent-300">{depositPercent}% deposit locks the slot</span>
          <span className="mono-sm text-ash-400">MoMo · Telecel · AT · Card</span>
          <span className="mono-sm text-ash-400">Instant email confirmation</span>
        </div>
      </section>

      {/* ── services ─────────────────────────────────────────── */}
      {services.length > 0 ? (
        <section className="mt-12">
          <SectionHeading
            index="Services"
            title="Pick a service"
            blurb={`Priced per hour. A ${depositPercent}% deposit paid online holds your slot; the balance is settled at the studio.`}
          />
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-3">
            {services.map((service, index) => (
              <div key={service.id} className="border-t border-ink-600 pt-3">
                <span className="mono-sm nums text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="headline mt-2 text-xl text-ash-50">{service.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-400">{service.description}</p>
                <p className="headline nums mt-4 text-2xl text-accent-300">
                  {formatMoney(service.pricePerHour, settings.currency)}
                  <span className="mono-sm ml-1.5 text-ash-500">/ hour</span>
                </p>
                <p className="mono-sm nums mt-1.5 text-ash-500">
                  {service.minHours}–{service.maxHours} hrs per session
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── booking widget ───────────────────────────────────── */}
      {services.length > 0 ? (
        <section id="book" className="mt-12 scroll-mt-24">
          <SectionHeading
            index="02 — Reserve"
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
          <div className="border border-dashed border-ink-600 px-6 py-16 text-center">
            <p className="mono-sm text-ash-500">Not open yet</p>
            <p className="headline mt-2 text-lg text-ash-100">Bookings are being set up</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ash-400">
              The producer hasn&apos;t published any studio services yet — check back soon or{""}
              <Link href="/contact" className="text-accent-300 hover:underline">
                send a message
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* ── hours + policy ───────────────────────────────────── */}
      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="section-head mono-sm text-ash-500">Opening hours</p>
          <ul className="mt-4">
            {hours.map((row) => (
              <li
                key={row.day}
                className="flex items-center justify-between border-b border-ink-800 py-2.5 text-sm"
              >
                <span className="mono-sm text-ash-300">{row.day}</span>
                <span
                  className={
                    row.label === "Closed"
                      ? "mono-sm nums text-ash-600"
                      : "mono-sm nums text-accent-300"
                  }
                >
                  {row.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-sm border-b border-ink-700 pb-2 text-ash-500">Booking policy</p>
          <p className="mt-4 text-sm leading-relaxed text-ash-300">{settings.studio_policy}</p>
          <ul className="mt-5 grid gap-3">
            <li className="flex gap-3 border-t border-ink-800 pt-3 text-sm leading-relaxed text-ash-400">
              <span className="mono-sm shrink-0 text-accent">01</span>
              Deposits can be paid with MTN MoMo, Telecel Cash, AirtelTigo Money or card — the{" "}
              {depositPercent}% deposit holds your slot the moment it lands.
            </li>
            <li className="flex gap-3 border-t border-ink-800 pt-3 text-sm leading-relaxed text-ash-400">
              <span className="mono-sm shrink-0 text-accent">02</span>
              The remaining balance is paid at the studio before your session starts.
            </li>
          </ul>
          <p className="mt-5 text-xs text-ash-500">
            Questions? Call{""}
            <a
              href={`tel:${settings.support_phone.replace(/\s/g, "")}`}
              className="text-accent-300 hover:underline"
            >
              {settings.support_phone}
            </a>
            {""}
            or email{""}
            <a
              href={`mailto:${settings.support_email}`}
              className="text-accent-300 hover:underline"
            >
              {settings.support_email}
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
