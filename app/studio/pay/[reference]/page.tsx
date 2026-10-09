import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Smartphone } from "lucide-react";
import { getBookingByReference } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatBookingDate, formatHour, openingHoursTable } from "@/lib/booking";
import { BookingClaimForm } from "@/components/booking-claim-form";
import { paystackEnabled } from "@/lib/paystack";

export const metadata: Metadata = { title: "Pay your studio deposit" };

export default async function BookingPayPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = getBookingByReference(reference);
  if (!booking) notFound();
  const settings = await getSettings();

  if (booking.status === "confirmed" || booking.status === "completed") {
    return (
      <div className="container-page py-16">
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-lime-400" />
          <h1 className="mt-4 text-xl font-bold">This session is confirmed</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Booking {booking.reference} is paid — your confirmation was emailed to {booking.email}.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/studio/confirmed/${booking.reference}`} className="btn btn-primary btn-sm">
              View booking
            </Link>
            <Link href="/studio" className="btn btn-secondary btn-sm">
              Studio home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMomo = booking.paymentMethod === "mobile_money";

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Booking reference</p>
              <h1 className="text-2xl font-extrabold tracking-tight">{booking.reference}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Deposit to send</p>
              <p className="text-2xl font-extrabold text-lime-300">{formatMoney(booking.amountDue, booking.currency)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-lime-400/25 bg-lime-400/[0.06] px-4 py-3 text-sm text-lime-100">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
            <p>
              {booking.serviceName} — <strong>{formatBookingDate(booking.date)}</strong>,{" "}
              {formatHour(booking.startHour)} – {formatHour(booking.endHour)} ({booking.hours} hr
              {booking.hours === 1 ? "" : "s"}). Your slot is held while you pay.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-xs text-amber-200">
            <Clock className="h-4 w-4 shrink-0" />
            {booking.status === "awaiting_verification"
              ? "Your payment details have been submitted — the producer is verifying them now. You'll get a confirmation email the moment the deposit clears."
              : `Send the deposit (${formatMoney(
                  booking.amountDue,
                  booking.currency
                )}) using the details below, then submit your transaction ID to lock the slot.`}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {isMomo ? (
              <>
                <Detail title="MTN Mobile Money" lines={[settings.momo_mtn, settings.momo_name]} />
                <Detail title="Telecel Cash" lines={[settings.momo_telecel, settings.momo_name]} />
                <Detail title="AT Money" lines={[settings.momo_at, settings.momo_name]} />
                <Detail title="Reference to quote" lines={[booking.reference, "Use this as the payment reference"]} />
              </>
            ) : (
              <>
                <Detail title={settings.bank_name} lines={[settings.bank_account_name, settings.bank_account_number]} />
                <Detail title="Branch" lines={[settings.bank_branch]} />
                <Detail title="Transfer description" lines={[booking.reference]} />
                <Detail title="Amount" lines={[formatMoney(booking.amountDue, booking.currency)]} />
              </>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-400">{settings.pay_instructions}</p>

          <dl className="mt-6 grid gap-2 rounded-2xl border border-ink-700 bg-ink-850 p-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Session total</dt>
              <dd className="font-medium">{formatMoney(booking.sessionTotal, booking.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Deposit now ({booking.depositPercent}%)</dt>
              <dd className="font-medium text-lime-300">{formatMoney(booking.depositAmount, booking.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Service fee ({booking.serviceFeePercent}%)</dt>
              <dd className="font-medium">{formatMoney(booking.serviceFeeAmount, booking.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Balance at the studio</dt>
              <dd className="font-medium">{formatMoney(booking.balanceAmount, booking.currency)}</dd>
            </div>
          </dl>

          {paystackEnabled() && booking.paymentMethod !== "paystack" && (
            <p className="mt-4 text-xs text-zinc-500">
              Changed your mind? Book again at{" "}
              <Link href="/studio" className="link-accent">
                /studio
              </Link>{" "}
              and pay online with mobile money or card instead — it confirms instantly.
            </p>
          )}
        </div>

        <div className="mt-6">
          <BookingClaimForm
            reference={booking.reference}
            alreadySubmitted={booking.status === "awaiting_verification"}
            payerNote={booking.payerNote}
          />
        </div>

        <div className="surface-card mt-6 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-4 w-4 text-lime-400" /> While you&apos;re here
          </h2>
          <p className="mt-2 flex items-start gap-2 text-xs text-zinc-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {settings.studio_policy}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {openingHoursTable(settings).map((row) => (
              <li key={row.day}>
                {row.day.slice(0, 3)}: <span className="text-zinc-400">{row.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Detail({ title, lines }: { title: string; lines: (string | null | undefined)[] }) {
  const clean = lines.filter(Boolean) as string[];
  if (!clean.length) return null;
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {clean.map((line, i) => (
        <p key={i} className={i === 0 ? "mt-1.5 text-sm font-bold" : "text-xs text-zinc-400"}>
          {line}
        </p>
      ))}
    </div>
  );
}
