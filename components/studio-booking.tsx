"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Mic,
} from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatHour, quoteBooking, todayISO } from "@/lib/schedule";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  pricePerHour: number;
  minHours: number;
  maxHours: number;
};

type Slot = { hour: number; available: boolean };

type Props = {
  services: ServiceOption[];
  depositPercent: number;
  serviceFeePercent: number;
  currency: string;
  user: { name: string; email: string; phone: string | null } | null;
};

const METHODS = ["paystack", "mobile_money", "bank_transfer"] as const;
type Method = (typeof METHODS)[number];

export function StudioBooking({ services, depositPercent, serviceFeePercent, currency, user }: Props) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const [date, setDate] = useState("");
  const [hours, setHours] = useState(service?.minHours ?? 1);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closedDay, setClosedDay] = useState(false);

  const [customer, setCustomer] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [method, setMethod] = useState<Method>("paystack");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = todayISO();
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  }, []);

  // Switching service resets anything the old service's rules dictated.
  function pickService(id: string) {
    const next = services.find((s) => s.id === id);
    if (!next) return;
    setServiceId(id);
    setHours((current) => Math.min(Math.max(current, next.minHours), next.maxHours));
    setStartHour(null);
    setError("");
  }

  function pickDate(value: string) {
    setDate(value);
    setStartHour(null);
    setError("");
    if (!value) setSlots([]);
  }

  function pickHours(value: number) {
    setHours(value);
    setStartHour(null);
    setError("");
  }

  const loadSlots = useCallback(async () => {
    if (!date || !service) return;
    setSlotsLoading(true);
    setClosedDay(false);
    try {
      const params = new URLSearchParams({
        date,
        hours: String(hours),
        serviceId: service.id,
      });
      const res = await fetch(`/api/bookings/availability?${params.toString()}`);
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not load times");
      if (json.closed) {
        setClosedDay(true);
        setSlots([]);
      } else {
        setSlots(json.slots as Slot[]);
      }
    } catch {
      setSlots(null);
    } finally {
      setSlotsLoading(false);
    }
  }, [date, hours, service]);

  useEffect(() => {
    if (!date) return;
    // Debounced so dragging across dates doesn't hammer the availability API,
    // and so state updates happen outside the effect body.
    const timer = setTimeout(() => void loadSlots(), 200);
    return () => clearTimeout(timer);
  }, [date, hours, serviceId, loadSlots]);

  const quote = useMemo(
    () =>
      quoteBooking({
        pricePerHour: service?.pricePerHour ?? 0,
        hours,
        depositPercent,
        serviceFeePercent,
      }),
    [service, hours, depositPercent, serviceFeePercent]
  );

  const ready = Boolean(service && date && startHour !== null && customer.name && customer.email && !submitting);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!service || startHour === null) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          hours,
          startHour,
          notes: notes || null,
          customer: { name: customer.name, email: customer.email, phone: customer.phone || null },
          method,
        }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Could not hold that slot — try another time.");
      }
      // Paystack needs a full browser navigation; internal routes work too.
      window.location.href = json.redirect as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
      void loadSlots(); // a race may have taken the slot — refresh the grid
    }
  }

  if (!service) return null;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      {/* ── steps ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <Step number={1} title="Service">
          <div className="grid gap-3 sm:grid-cols-3">
            {services.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => pickService(option.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  option.id === serviceId
                    ? "border-lime-400/60 bg-lime-400/[0.07]"
                    : "border-ink-700 bg-ink-850 hover:border-ink-600"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Mic className={cn("h-4 w-4", option.id === serviceId ? "text-lime-300" : "text-zinc-500")} />
                  {option.name}
                </span>
                <span className="mt-1.5 block text-sm font-bold text-lime-300">
                  {formatMoney(option.pricePerHour, currency)}
                  <span className="text-xs font-medium text-zinc-500">/hr</span>
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  {option.minHours}–{option.maxHours} hrs
                </span>
              </button>
            ))}
          </div>
          {service.description && <p className="mt-3 text-sm leading-relaxed text-zinc-400">{service.description}</p>}
        </Step>

        <Step number={2} title="Date & duration">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="booking-date">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                required
                min={today}
                max={maxDate}
                value={date}
                onChange={(e) => pickDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="booking-hours">
                Duration
              </label>
              <select
                id="booking-hours"
                value={hours}
                onChange={(e) => pickHours(Number(e.target.value))}
                className="select"
              >
                {Array.from({ length: service.maxHours - service.minHours + 1 }, (_, i) => service.minHours + i).map(
                  (h) => (
                    <option key={h} value={h}>
                      {h} hour{h === 1 ? "" : "s"}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </Step>

        <Step number={3} title="Start time">
          {!date ? (
            <p className="text-sm text-zinc-500">Pick a date first, then the free start times appear here.</p>
          ) : slotsLoading ? (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking the calendar…
            </p>
          ) : closedDay || !slots?.length ? (
            <p className="text-sm text-amber-300/90">
              The studio is closed that day — try another date.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.hour}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setStartHour(slot.hour)}
                  title={slot.available ? undefined : "Already booked"}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm transition",
                    slot.available ? "hover:border-lime-400/60" : "cursor-not-allowed opacity-35 line-through",
                    startHour === slot.hour
                      ? "border-lime-400/70 bg-lime-400/15 text-lime-200"
                      : slot.available
                        ? "border-ink-700 bg-ink-850 text-zinc-300"
                        : "border-ink-800 bg-ink-900 text-zinc-600"
                  )}
                >
                  {formatHour(slot.hour)}
                </button>
              ))}
            </div>
          )}
          {date && startHour !== null && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-lime-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {formatHour(startHour)} – {formatHour(startHour + hours)} · {hours} hr{hours === 1 ? "" : "s"}
            </p>
          )}
        </Step>

        <Step number={4} title="Notes for the engineer (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="e.g. Tracking vocals for two artists — need the vocal chain ready and a rough mix at the end."
            className="input resize-y"
          />
        </Step>
      </div>

      {/* ── summary + details ─────────────────────────────── */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="surface-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
            <CalendarDays className="h-4 w-4 text-lime-400" /> Summary
          </h3>
          <p className="mt-3 text-sm font-semibold">{service.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {date ? (
              <>
                {date} · {startHour !== null ? formatHour(startHour) : "Pick a start time"} · {hours} hr
                {hours === 1 ? "" : "s"}
              </>
            ) : (
              "Pick a date to see your slot"
            )}
          </p>

          <dl className="mt-4 space-y-2 border-t border-ink-800 pt-4 text-sm">
            <Row label={`Session (${hours} × ${formatMoney(service.pricePerHour, currency)})`}>
              {formatMoney(quote.sessionTotal, currency)}
            </Row>
            <Row label={`Deposit to lock slot (${quote.depositPercent}%)`}>
              {formatMoney(quote.depositAmount, currency)}
            </Row>
            <Row label={`Service fee (${quote.serviceFeePercent}%)`}>
              {formatMoney(quote.serviceFeeAmount, currency)}
            </Row>
            <div className="flex items-center justify-between border-t border-ink-800 pt-2.5 text-base font-bold">
              <span>Pay now</span>
              <span className="text-lime-300">{formatMoney(quote.amountDue, currency)}</span>
            </div>
            <Row label="Balance at the studio" muted>
              {formatMoney(quote.balanceAmount, currency)}
            </Row>
          </dl>
        </div>

        <div className="surface-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">5 · Your details</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="bk-name">
                Full name
              </label>
              <input
                id="bk-name"
                required
                minLength={2}
                className="input"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Kwesi Mensah"
              />
            </div>
            <div>
              <label className="label" htmlFor="bk-email">
                Email address
              </label>
              <input
                id="bk-email"
                type="email"
                required
                className="input"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="you@example.com"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                Your confirmation and session details are delivered to this address. Use your account email to see
                bookings in your dashboard.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="bk-phone">
                Phone (optional)
              </label>
              <input
                id="bk-phone"
                className="input"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="024 000 0000"
              />
            </div>
          </div>

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-zinc-300">Pay with</h3>
          <div className="mt-3 space-y-2">
            {METHODS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={cn(
                  "w-full rounded-2xl border p-3.5 text-left transition",
                  method === id ? "border-lime-400/60 bg-lime-400/[0.06]" : "border-ink-700 bg-ink-850 hover:border-ink-600"
                )}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {PAYMENT_METHODS[id].label}
                  {method === id && <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-300" />}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  {PAYMENT_METHODS[id].blurb}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}

          <button type="submit" disabled={!ready} className="btn btn-primary btn-lg mt-5 w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Holding your slot…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pay deposit {formatMoney(quote.amountDue, currency)}
              </>
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
            <Clock className="h-3 w-3" /> Your slot is held the moment the deposit lands.
            <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </div>
    </form>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
        <span className="grid h-5.5 w-5.5 place-items-center rounded-full bg-lime-400 text-[11px] font-extrabold text-ink-950">
          {number}
        </span>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
  muted,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={muted ? "text-zinc-500" : "text-zinc-400"}>{label}</dt>
      <dd className={cn("shrink-0 font-medium", muted ? "text-zinc-400" : "text-zinc-200")}>{children}</dd>
    </div>
  );
}
