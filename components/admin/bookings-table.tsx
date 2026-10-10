"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatBookingDate, formatHour } from "@/lib/schedule";
import { BOOKING_STATUS } from "@/lib/constants";
import { safeJson } from "@/lib/api-client";

export type AdminBooking = {
  id: string;
  reference: string;
  serviceName: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  startHour: number;
  endHour: number;
  hours: number;
  sessionTotal: number;
  depositAmount: number;
  serviceFeeAmount: number;
  amountDue: number;
  balanceAmount: number;
  currency: string;
  notes: string | null;
  status: string;
  paymentMethod: string;
  payerNote: string | null;
  paidAt: string | null;
  createdAt: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "awaiting_verification", label: "To verify" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Unpaid" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export function BookingsTable({
  bookings,
  currentFilter,
}: {
  bookings: AdminBooking[];
  currentFilter: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const filtered = bookings.filter((booking) => {
    if (!query.trim()) return true;
    const needle = query.toLowerCase();
    return (
      booking.reference.toLowerCase().includes(needle) ||
      booking.email.toLowerCase().includes(needle) ||
      booking.name.toLowerCase().includes(needle) ||
      booking.serviceName.toLowerCase().includes(needle)
    );
  });

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setFlash("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Action failed");
      if (action === "confirm")
        setFlash("Deposit confirmed — the artist's confirmation email is on its way.");
      if (action === "complete") setFlash("Session marked as completed.");
      if (action === "cancel") setFlash("Booking cancelled and the artist notified.");
      if (action === "resend_confirmation") setFlash("Confirmation email re-sent.");
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this booking permanently? Prefer cancelling it instead.")) return;
    await act(id, "delete");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, artist or service"
            className="input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => router.push(`/admin/bookings?status=${filter.id}`)}
              className={` border px-3 py-1.5 text-xs transition ${
                currentFilter === filter.id
                  ? "border-accent-400/60 bg-accent-400/15 text-accent-200"
                  : "border-ink-700 bg-ink-850 text-ash-400 hover:text-ash-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {flash && (
        <p className="border border-accent-400/30 bg-accent-400/10 px-3 py-2 text-xs text-accent-200">
          {flash}
        </p>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="surface-card grid place-items-center gap-2 p-12 text-center">
            <p className="text-sm text-ash-400">No bookings here yet.</p>
          </div>
        )}
        {filtered.map((booking) => {
          const status = BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
          const busy = busyId === booking.id;
          return (
            <div key={booking.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-accent-300">
                      {booking.reference}
                    </p>
                    <span
                      className={`badge ${
                        booking.status === "confirmed"
                          ? "bg-accent-400/15 text-accent-300"
                          : booking.status === "awaiting_verification" ||
                              booking.status === "pending"
                            ? "bg-amber-500/15 text-amber-300"
                            : booking.status === "cancelled"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-ink-700 text-ash-400"
                      }`}
                    >
                      {status?.label ?? booking.status}
                    </span>
                    <span className="chip">{booking.paymentMethod.replace("_", "")}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">
                    {booking.serviceName} · {formatBookingDate(booking.date)} ·{" "}
                    {formatHour(booking.startHour)}–{formatHour(booking.endHour)}
                  </p>
                  <p className="mt-0.5 text-sm">
                    {booking.name} ·{""}
                    <a
                      href={`mailto:${booking.email}`}
                      className="text-ash-400 hover:text-accent-300"
                    >
                      {booking.email}
                    </a>
                    {booking.phone ? ` · ${booking.phone}` : ""}
                  </p>
                  <p className="text-xs text-ash-500">
                    Booked {formatDate(booking.createdAt, true)}
                    {booking.paidAt ? ` · deposit paid ${formatDate(booking.paidAt, true)}` : ""}
                    {booking.payerNote ? ` · ref: ${booking.payerNote}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="headline nums text-lg text-accent-300">
                    {formatMoney(booking.amountDue, booking.currency)}
                  </p>
                  <p className="text-xs text-ash-500">
                    deposit of {formatMoney(booking.sessionTotal, booking.currency)} total
                  </p>
                  <p className="text-xs text-ash-500">
                    balance {formatMoney(booking.balanceAmount, booking.currency)} at studio
                  </p>
                </div>
              </div>

              {booking.notes && (
                <p className="mt-3 border border-ink-700 bg-ink-850 px-3 py-2 text-xs text-ash-400">
                  Artist note: {booking.notes}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(booking.status === "pending" || booking.status === "awaiting_verification") && (
                  <button
                    type="button"
                    onClick={() => act(booking.id, "confirm")}
                    disabled={busy}
                    className="btn btn-primary btn-sm"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Confirm deposit
                  </button>
                )}
                {booking.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() => act(booking.id, "complete")}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark session completed
                  </button>
                )}
                {booking.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => act(booking.id, "resend_confirmation")}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend confirmation
                  </button>
                )}
                {booking.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() => act(booking.id, "resend_confirmation")}
                    disabled={busy}
                    className="btn btn-ghost btn-sm"
                  >
                    <Mail className="h-3.5 w-3.5" /> Resend email
                  </button>
                )}
                {["pending", "awaiting_verification", "confirmed"].includes(booking.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Cancel this booking? The artist is notified by email."))
                        act(booking.id, "cancel");
                    }}
                    disabled={busy}
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(booking.id)}
                  disabled={busy}
                  className="btn btn-ghost btn-sm ml-auto text-ash-500"
                  aria-label="Delete booking"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
