"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { safeJson } from "@/lib/api-client";

export function PayOnlineButton({ reference, enabled }: { reference: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not start the payment.");
      if (!json.redirect) throw new Error("Could not start the payment.");
      window.location.href = json.redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={pay}
        disabled={!enabled || busy}
        className="btn btn-primary btn-lg w-full"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {enabled ? "Pay with mobile money or card" : "Online payments unavailable"}
      </button>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </>
  );
}
