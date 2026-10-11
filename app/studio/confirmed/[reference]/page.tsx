import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck2, Clock, Mail, MapPin, Wallet } from "lucide-react";
import { getBookingByReference } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatBookingDate, formatHour } from "@/lib/booking";
import { BOOKING_STATUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Session confirmed" };

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = getBookingByReference(reference);
  if (!booking) notFound();
  const settings = await getSettings();
  const status = BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
  const paid = booking.status === "confirmed" || booking.status === "completed";

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <div className="surface-card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center border border-accent bg-accent-600/15 text-accent-300">
            <CalendarCheck2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 display text-2xl text-ash-50">
            {paid ? "Your session is booked!" : "Your slot is on hold"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ash-400">
            {paid
              ? `Deposit received for ${booking.serviceName}. A confirmation email with everything you need is on its way to ${booking.email}.`
              : `We're holding your ${booking.serviceName} slot while the ${formatMoney(
                  booking.amountDue,
                  booking.currency,
                )} deposit is verified. You'll get a confirmation email the moment it clears.`}
          </p>
          {!paid && (
            <Link href={`/studio/pay/${booking.reference}`} className="btn btn-primary btn-md mt-5">
              Open payment page
            </Link>
          )}
        </div>

        <div className="surface-card mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 pb-4">
            <div>
              <p className="mono-sm text-ash-500">Booking reference</p>
              <p className="text-lg font-extrabold">{booking.reference}</p>
            </div>
            <span className="badge bg-accent-400/15 text-accent-300">
              {status?.label ?? booking.status}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <div>
                <dt className="text-ash-500">When</dt>
                <dd className="font-semibold">
                  {formatBookingDate(booking.date)} · {formatHour(booking.startHour)} –{" "}
                  {formatHour(booking.endHour)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <div>
                <dt className="text-ash-500">Service</dt>
                <dd className="font-semibold">
                  {booking.serviceName} · {booking.hours} hr{booking.hours === 1 ? "" : "s"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <div>
                <dt className="text-ash-500">Money</dt>
                <dd className="font-semibold">
                  Deposit paid {formatMoney(booking.amountDue, booking.currency)} · balance{""}
                  {formatMoney(booking.balanceAmount, booking.currency)} at the studio
                </dd>
              </div>
            </div>
            {booking.notes && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <div>
                  <dt className="text-ash-500">Your notes</dt>
                  <dd className="whitespace-pre-line text-ash-300">{booking.notes}</dd>
                </div>
              </div>
            )}
          </dl>

          <p className="mt-5 border border-ink-700 bg-ink-850 px-4 py-3 text-xs leading-relaxed text-ash-400">
            {settings.studio_policy}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/beats" className="btn btn-secondary btn-sm">
            Browse beats while you wait
          </Link>
          <Link href="/studio" className="btn btn-ghost btn-sm">
            Back to studio
          </Link>
        </div>
      </div>
    </div>
  );
}
