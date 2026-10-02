"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/constants";

export type AdminOrder = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  payerNote: string | null;
  paymentRef: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  items: { id: string; title: string; licenseName: string; price: number; tier: string }[];
  paystackEnabled: boolean;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "awaiting_verification", label: "To verify" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
];

export function OrdersTable({ orders, currentFilter }: { orders: AdminOrder[]; currentFilter: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const filtered = orders.filter((order) => {
    if (!query.trim()) return true;
    const needle = query.toLowerCase();
    return (
      order.reference.toLowerCase().includes(needle) ||
      order.email.toLowerCase().includes(needle) ||
      order.name.toLowerCase().includes(needle)
    );
  });

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setFlash("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Action failed");
      if (action === "mark_paid") setFlash("Marked as paid — the buyer's download email has been sent.");
      if (action === "resend_delivery") setFlash("Delivery email re-sent with fresh links.");
      if (action === "set_status") setFlash(`Status updated to ${json.status}.`);
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this order permanently? Prefer cancelling it instead.")) return;
    await act(id, "delete");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, name or email"
            className="input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => router.push(`/admin/orders?status=${filter.id}`)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                currentFilter === filter.id
                  ? "border-lime-400/60 bg-lime-400/15 text-lime-200"
                  : "border-ink-700 bg-ink-850 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {flash && (
        <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-200">
          {flash}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((order) => {
          const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
          const busy = busyId === order.id;
          return (
            <div key={order.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-lime-300">{order.reference}</p>
                    <span
                      className={`badge ${
                        order.status === "paid"
                          ? "bg-lime-400/15 text-lime-300"
                          : order.status === "awaiting_verification"
                            ? "bg-amber-500/15 text-amber-300"
                            : order.status === "failed" || order.status === "cancelled"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-ink-700 text-zinc-400"
                      }`}
                    >
                      {status?.label ?? order.status}
                    </span>
                    <span className="chip">{order.paymentMethod.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1.5 text-sm">
                    {order.name} ·{" "}
                    <a href={`mailto:${order.email}`} className="text-zinc-400 hover:text-lime-300">
                      {order.email}
                    </a>
                    {order.phone ? ` · ${order.phone}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(order.createdAt, true)}
                    {order.payerNote ? ` · ref: ${order.payerNote}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatMoney(order.total, order.currency)}</p>
                  <p className="text-xs text-zinc-500">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-ink-700 pt-3 text-xs">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-zinc-400">
                    <span>
                      {item.title} <span className="text-zinc-600">· {item.licenseName}</span>
                    </span>
                    <span>{formatMoney(item.price, order.currency)}</span>
                  </li>
                ))}
              </ul>

              {order.note && (
                <p className="mt-3 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-xs text-zinc-400">
                  Customer note: {order.note}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {order.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => act(order.id, "mark_paid")}
                    disabled={busy}
                    className="btn btn-primary btn-sm"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Mark as paid &amp; deliver
                  </button>
                )}
                {order.status === "paid" && (
                  <button
                    type="button"
                    onClick={() => act(order.id, "resend_delivery")}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend delivery email
                  </button>
                )}
                {order.status === "awaiting_verification" && (
                  <button
                    type="button"
                    onClick={() => act(order.id, "set_status", { status: "pending" })}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Payment not found
                  </button>
                )}
                {["pending", "failed"].includes(order.status) && (
                  <button
                    type="button"
                    onClick={() => act(order.id, "set_status", { status: "cancelled" })}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel order
                  </button>
                )}
                {order.status === "paid" && (
                  <button
                    type="button"
                    onClick={() => act(order.id, "set_status", { status: "refunded" })}
                    disabled={busy}
                    className="btn btn-secondary btn-sm"
                  >
                    Mark refunded
                  </button>
                )}
                <a href={`mailto:${order.email}?subject=Your order ${order.reference}`} className="btn btn-ghost btn-sm">
                  <Mail className="h-3.5 w-3.5" /> Email buyer
                </a>
                <button
                  type="button"
                  onClick={() => remove(order.id)}
                  disabled={busy}
                  className="btn btn-ghost btn-sm ml-auto text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="surface-card grid place-items-center py-14 text-sm text-zinc-500">
            No orders match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
