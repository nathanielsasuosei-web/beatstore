"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { safeJson } from "@/lib/api-client";

export type AdminService = {
  id: string;
  name: string;
  description: string | null;
  pricePerHour: number;
  minHours: number;
  maxHours: number;
  active: boolean;
};

/** Add / edit / retire the bookable studio services. */
export function ServicesManager({
  services,
  currency,
}: {
  services: AdminService[];
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    price: "",
    minHours: "1",
    maxHours: "8",
    description: "",
  });

  async function patch(id: string, values: Record<string, unknown>) {
    setBusy(id);
    setFlash("");
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Update failed");
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? Past bookings keep their session name.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Delete failed");
      setFlash(`"${name}" deleted.`);
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy("new");
    setFlash("");
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description || null,
          pricePerHour: Number(draft.price) || 0,
          minHours: Number(draft.minHours) || 1,
          maxHours: Number(draft.maxHours) || 8,
        }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not add the service");
      setDraft({ name: "", price: "", minHours: "1", maxHours: "8", description: "" });
      setAdding(false);
      setFlash("Service added — it's bookable right away.");
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {flash && (
        <p className=" border border-accent-400/30 bg-accent-400/10 px-3 py-2 text-xs text-accent-200">
          {flash}
        </p>
      )}

      {services.map((service) => (
        <div key={service.id} className="surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              defaultValue={service.name}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== service.name) patch(service.id, { name: value });
              }}
              className="input w-44"
              aria-label={`${service.name} name`}
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                step="0.01"
                defaultValue={(service.pricePerHour / 100).toFixed(2)}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 0 && Math.round(value * 100) !== service.pricePerHour) {
                    patch(service.id, { pricePerHour: value });
                  }
                }}
                className="input w-24"
                aria-label={`${service.name} price per hour`}
              />
              <span className="text-xs text-ash-500">{currency}/hr</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ash-500">
              <input
                type="number"
                min={1}
                max={16}
                defaultValue={service.minHours}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value !== service.minHours)
                    patch(service.id, { minHours: value });
                }}
                className="input w-16"
                aria-label={`${service.name} minimum hours`}
              />
              –
              <input
                type="number"
                min={1}
                max={16}
                defaultValue={service.maxHours}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value !== service.maxHours)
                    patch(service.id, { maxHours: value });
                }}
                className="input w-16"
                aria-label={`${service.name} maximum hours`}
              />
              hrs
            </div>
            <button
              type="button"
              onClick={() => patch(service.id, { active: !service.active })}
              disabled={busy === service.id}
              className={`btn btn-sm ${service.active ? "btn-secondary" : "btn-ghost"}`}
            >
              {busy === service.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : service.active ? (
                "Visible"
              ) : (
                "Hidden"
              )}
            </button>
            <button
              type="button"
              onClick={() => remove(service.id, service.name)}
              disabled={busy === service.id}
              className="btn btn-ghost btn-sm ml-auto text-ash-500"
              aria-label={`Delete ${service.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            defaultValue={service.description ?? ""}
            placeholder="Short description shown on the studio page…"
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value !== (service.description ?? ""))
                patch(service.id, { description: value || null });
            }}
            className="input mt-3 text-sm"
            aria-label={`${service.name} description`}
          />
          <p className="mt-2 text-xs text-ash-500">
            {formatMoney(service.pricePerHour, currency)} per hour · {service.minHours}–
            {service.maxHours} hrs per session. Edits save when you click away.
          </p>
        </div>
      ))}

      {adding ? (
        <form onSubmit={add} className="surface-card space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              required
              minLength={2}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Service name"
              className="input sm:col-span-2"
              aria-label="New service name"
            />
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder={`Price (${currency})`}
              className="input"
              aria-label="New service price"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={16}
                value={draft.minHours}
                onChange={(e) => setDraft({ ...draft, minHours: e.target.value })}
                className="input w-full"
                aria-label="Minimum hours"
              />
              –
              <input
                type="number"
                min={1}
                max={16}
                value={draft.maxHours}
                onChange={(e) => setDraft({ ...draft, maxHours: e.target.value })}
                className="input w-full"
                aria-label="Maximum hours"
              />
            </div>
          </div>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="Short description…"
            className="input resize-y"
            aria-label="New service description"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy === "new"} className="btn btn-primary btn-sm">
              {busy === "new" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add service
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-secondary btn-sm">
          <Plus className="h-3.5 w-3.5" /> Add a service
        </button>
      )}
    </div>
  );
}
