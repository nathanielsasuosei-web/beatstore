"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";
import { safeJson } from "@/lib/api-client";

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
        tone === "error"
          ? "border-red-900/60 bg-red-950/40 text-red-300"
          : "border-lime-400/30 bg-lime-400/10 text-lime-200"
      }`}
    >
      {tone === "error" ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not sign you in.");
      router.push(redirectTo || json.redirect || "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-6 sm:p-7">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Sign in to grab your downloads, licences and receipts.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}

      <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-6 w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <Link href="/forgot-password" className="hover:text-lime-300">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-lime-300">
          Create an artist account
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    stageName: "",
    email: "",
    phone: "",
    country: "Ghana",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not create your account.");
      router.push("/account?welcome=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-6 sm:p-7">
      <h1 className="text-2xl font-bold tracking-tight">Create your artist account</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Free, no spam. Keeps every beat, licence and receipt in one place — checkout works as a guest too.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Kojo Mensah"
          />
        </div>
        <div>
          <label className="label" htmlFor="stageName">
            Stage name (optional)
          </label>
          <input
            id="stageName"
            className="input"
            value={form.stageName}
            onChange={(e) => setForm({ ...form, stageName: e.target.value })}
            placeholder="Kojo Wavez"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone (optional)
          </label>
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+233 24 000 0000"
          />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className="input"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>
      </div>

      {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}

      <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-6 w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-4 text-xs text-zinc-500">
        A confirmation email is sent straight away. Already have an account?{" "}
        <Link href="/login" className="link-accent">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not send the reset link.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-6 sm:p-7">
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Enter the email you signed up with and a reset link lands in your inbox within a minute.
      </p>

      {done ? (
        <div className="mt-6">
          <Notice tone="success">
            If that email is registered, a reset link is on its way. Check spam if it hasn&apos;t arrived in a
            few minutes.
          </Notice>
          <Link href="/login" className="btn btn-secondary btn-sm mt-4">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-6 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not reset your password.");
      setDone(true);
      setTimeout(() => router.push("/login"), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-6 sm:p-7">
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>

      {done ? (
        <div className="mt-6">
          <Notice tone="success">Password updated. Taking you to sign in…</Notice>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-6 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Saving…" : "Set new password"}
          </button>
        </>
      )}
    </form>
  );
}
