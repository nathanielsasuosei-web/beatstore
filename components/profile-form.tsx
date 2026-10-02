"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; stageName: string; phone: string; country: string };
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    ...defaults,
    currentPassword: "",
    newPassword: "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not save your details.");
      setState("saved");
      setMessage(json.message ?? "Saved.");
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setShowPassword(false);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-name">
            Full name
          </label>
          <input
            id="profile-name"
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-stage">
            Stage name
          </label>
          <input
            id="profile-stage"
            className="input"
            value={form.stageName}
            onChange={(e) => setForm({ ...form, stageName: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-country">
            Country
          </label>
          <input
            id="profile-country"
            className="input"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
      </div>

      {showPassword ? (
        <div className="mt-4 grid gap-4 rounded-2xl border border-ink-700 bg-ink-850 p-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              className="input"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              minLength={8}
              className="input"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPassword(true)}
          className="mt-4 text-xs text-zinc-400 hover:text-lime-300"
        >
          Change password
        </button>
      )}

      {state === "error" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5" /> {message}
        </p>
      )}
      {state === "saved" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> {message}
        </p>
      )}

      <button type="submit" disabled={state === "saving"} className="btn btn-primary mt-5">
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
}
