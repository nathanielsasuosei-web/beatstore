"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { safeJson } from "@/lib/api-client";

export function BookingClaimForm({
  reference,
  alreadySubmitted,
  payerNote,
}: {
  reference: string;
  alreadySubmitted?: boolean;
  payerNote?: string | null;
}) {
  const [form, setForm] = useState({ payerNote: "", amountPaid: "", paidFrom: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(Boolean(alreadySubmitted));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(reference)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not submit your payment details.");
      setState("sent");
      setDone(true);
      setMessage(
        "Got it — the producer is checking the payment now. Your slot stays held and you'll get a confirmation email the moment the deposit clears."
      );
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (done && state !== "error") {
    return (
      <div className="surface-card p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
          <div>
            <h2 className="font-semibold">Deposit details received</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {message || "We have your payment details and are verifying them now."}
            </p>
            {payerNote && (
              <p className="mt-3 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-xs text-zinc-400">
                Submitted: {payerNote}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface-card p-6">
      <h2 className="font-semibold">I&apos;ve sent the deposit</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Enter the transaction ID (MoMo SMS reference) or the bank transfer reference so it can be matched to your
        booking.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bk-payerNote">
            Transaction ID / reference
          </label>
          <input
            id="bk-payerNote"
            required
            minLength={3}
            className="input"
            value={form.payerNote}
            onChange={(e) => setForm({ ...form, payerNote: e.target.value })}
            placeholder="e.g. MTN MoMo ref 90214478"
          />
        </div>
        <div>
          <label className="label" htmlFor="bk-amountPaid">
            Amount sent (optional)
          </label>
          <input
            id="bk-amountPaid"
            className="input"
            value={form.amountPaid}
            onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
            placeholder="150.00"
          />
        </div>
        <div>
          <label className="label" htmlFor="bk-paidFrom">
            Sent from (optional)
          </label>
          <input
            id="bk-paidFrom"
            className="input"
            value={form.paidFrom}
            onChange={(e) => setForm({ ...form, paidFrom: e.target.value })}
            placeholder="Name or MoMo number"
          />
        </div>
      </div>

      {state === "error" && (
        <p className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {message}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn btn-primary btn-lg mt-5 w-full">
        {state === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit deposit details
          </>
        )}
      </button>
    </form>
  );
}
