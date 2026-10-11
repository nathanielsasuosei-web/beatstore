"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MailCheck,
  UserPlus,
} from "lucide-react";
import { safeJson } from "@/lib/api-client";
import { cn, cssVars } from "@/lib/utils";

/* ── building blocks ───────────────────────────────────────── */

/** Wraps a block so it rises into place on a staggered delay. */
function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rise", className)} style={cssVars({ "--d": `${delay}ms` })}>
      {children}
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      key={String(children)}
      className={cn(
        "shake flex items-start gap-2 border px-3 py-2.5 text-xs",
        tone === "error"
          ? "border-red-900/60 bg-red-950/40 text-red-300"
          : "border-accent-400/30 bg-accent-400/10 text-accent-200",
      )}
      style={{ borderRadius: "var(--radius-ui)" }}
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

/** Text field with a focus rail, an optional reveal toggle and an optional hint. */
function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  required,
  minLength,
  hint,
  reveal,
  delay = 0,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  minLength?: number;
  hint?: React.ReactNode;
  /** Show the password eye. */
  reveal?: boolean;
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const inputType = reveal ? (shown ? "text" : "password") : type;

  return (
    <Reveal delay={delay} className={className}>
      <div>
        <label className="label" htmlFor={id}>
          {label}
        </label>
        <div className="field-rail relative">
          <input
            id={id}
            type={inputType}
            required={required}
            minLength={minLength}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            className={cn("input", reveal && "pr-11")}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
          {reveal && (
            <button
              type="button"
              onClick={() => setShown((current) => !current)}
              className="absolute right-0 top-0 grid h-full w-11 place-items-center text-ash-500 transition-colors hover:text-ash-200"
              aria-label={shown ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hint}
      </div>
    </Reveal>
  );
}

/** Four bars that fill as the password gets stronger. */
function StrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password);
  const labels = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="h-1 flex-1 overflow-hidden bg-ink-700"
            style={{ borderRadius: 2 }}
          >
            <span
              className="block h-full origin-left transition-transform duration-500"
              style={{
                background: index < score ? "var(--accent)" : "transparent",
                transform: index < score ? "scaleX(1)" : "scaleX(0)",
                transitionTimingFunction: "var(--ease-out-quint)",
              }}
            />
          </span>
        ))}
      </div>
      <p className="mono-sm mt-1.5 text-ash-500">
        {password ? labels[score] : "Use 8+ characters, mix letters and numbers"}
      </p>
    </div>
  );
}

function passwordScore(password: string): number {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score += 1;
  return Math.min(score, 4);
}

/** The tick that draws itself once an auth call succeeds. */
function SuccessMark({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="auth-success flex flex-col items-center py-6 text-center">
      <span className="relative grid h-16 w-16 place-items-center">
        <span
          className="loop-ring absolute inset-0 rounded-full border border-accent"
          aria-hidden
        />
        <svg viewBox="0 0 48 48" className="h-16 w-16" fill="none" aria-hidden>
          <circle cx="24" cy="24" r="21" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1" />
          <path
            className="tick-path"
            d="M15 24.5l6.2 6.2L33.5 18"
            stroke="var(--accent)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="headline mt-4 text-lg text-ash-50">{title}</p>
      <p className="mt-1.5 text-sm text-ash-400">{blurb}</p>
    </div>
  );
}

function SubmitButton({
  busy,
  succeeded,
  idleLabel,
  busyLabel,
  successLabel,
  icon,
  delay = 0,
}: {
  busy: boolean;
  succeeded?: boolean;
  idleLabel: string;
  busyLabel: string;
  successLabel: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <button
        type="submit"
        disabled={busy || succeeded}
        className={cn("btn btn-primary btn-lg sheen mt-6 w-full", (busy || succeeded) && "!opacity-100")}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : succeeded ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          icon
        )}
        {busy ? busyLabel : succeeded ? successLabel : idleLabel}
      </button>
    </Reveal>
  );
}

/* ── sign in ───────────────────────────────────────────────── */

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || succeeded) return;
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
      // Let the success state play before navigating.
      setBusy(false);
      setSucceeded(true);
      window.setTimeout(() => {
        router.push(redirectTo || json.redirect || "/account");
        router.refresh();
      }, 780);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="glass p-6 sm:p-7"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {succeeded ? (
        <SuccessMark title="You're in" blurb="Taking you to your library…" />
      ) : (
        <>
          <Reveal delay={60}>
            <div>
              <p className="mono-sm text-accent">Artist sign in</p>
              <h1 className="headline mt-2 text-2xl text-ash-50">Welcome back</h1>
              <p className="mt-1.5 text-sm text-ash-400">
                Grab your downloads, licences and receipts.
              </p>
            </div>
          </Reveal>

          <div className="mt-6 space-y-4">
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
              placeholder="you@email.com"
              delay={140}
            />
            <Field
              id="password"
              label="Password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
              placeholder="••••••••"
              reveal
              delay={210}
            />
          </div>

          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <SubmitButton
            busy={busy}
            succeeded={succeeded}
            idleLabel="Sign in"
            busyLabel="Signing in…"
            successLabel="Signed in"
            icon={<LogIn className="h-4 w-4" />}
            delay={280}
          />

          <Reveal delay={340}>
            <div className="mt-4 flex items-center justify-between text-xs text-ash-500">
              <Link href="/forgot-password" className="underline-slide hover:text-accent-300">
                Forgot password?
              </Link>
              <Link href="/register" className="underline-slide hover:text-accent-300">
                Create an artist account
              </Link>
            </div>
          </Reveal>
        </>
      )}
    </form>
  );
}

/* ── register ──────────────────────────────────────────────── */

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
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || succeeded) return;
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
      setBusy(false);
      setSucceeded(true);
      window.setTimeout(() => {
        router.push("/account?welcome=1");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="glass p-6 sm:p-7"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {succeeded ? (
        <SuccessMark title="Account created" blurb="Check your inbox — a welcome email is on its way." />
      ) : (
        <>
          <Reveal delay={80}>
            <div>
              <p className="mono-sm text-accent">New artist</p>
              <h1 className="headline mt-2 text-2xl text-ash-50">Create your artist account</h1>
              <p className="mt-1.5 text-sm text-ash-400">
                Free, no spam. Keeps every beat, licence and receipt in one place — checkout works
                as a guest too.
              </p>
            </div>
          </Reveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label="Full name"
              required
              autoFocus
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              placeholder="Kojo Mensah"
              delay={170}
            />
            <Field
              id="stageName"
              label="Stage name (optional)"
              value={form.stageName}
              onChange={(stageName) => setForm({ ...form, stageName })}
              placeholder="Kojo Wavez"
              delay={215}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
              placeholder="you@email.com"
              delay={260}
              className="sm:col-span-2"
            />
            <Field
              id="phone"
              label="Phone (optional)"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
              placeholder="+233 24 000 0000"
              delay={305}
            />
            <Field
              id="country"
              label="Country"
              value={form.country}
              onChange={(country) => setForm({ ...form, country })}
              delay={350}
            />
            <div className="sm:col-span-2">
              <Field
                id="password"
                label="Password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                placeholder="At least 8 characters"
                reveal
                delay={395}
                hint={<StrengthMeter password={form.password} />}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <SubmitButton
            busy={busy}
            succeeded={succeeded}
            idleLabel="Create account"
            busyLabel="Creating account…"
            successLabel="Account created"
            icon={<UserPlus className="h-4 w-4" />}
            delay={450}
          />

          <Reveal delay={500}>
            <p className="mt-4 text-xs text-ash-500">
              A confirmation email is sent straight away. Already have an account?{" "}
              <Link href="/login" className="link-accent">
                Sign in
              </Link>
              .
            </p>
          </Reveal>
        </>
      )}
    </form>
  );
}

/* ── forgot password ───────────────────────────────────────── */

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
    <form
      onSubmit={submit}
      className="glass p-6 sm:p-7"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {done ? (
        <div className="auth-success">
          <span className="grid h-12 w-12 place-items-center border border-accent-600 bg-accent-600/20">
            <MailCheck className="h-5 w-5 text-accent-300" />
          </span>
          <p className="headline mt-4 text-lg text-ash-50">Check your inbox</p>
          <p className="mt-1.5 text-sm text-ash-400">
            If that email is registered, a reset link is on its way. Check spam if it hasn&apos;t
            arrived in a few minutes.
          </p>
          <Link href="/login" className="btn btn-secondary btn-sm mt-5">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <Reveal delay={60}>
            <div>
              <p className="mono-sm text-accent">Account recovery</p>
              <h1 className="headline mt-2 text-2xl text-ash-50">Reset your password</h1>
              <p className="mt-1.5 text-sm text-ash-400">
                Enter the email you signed up with and a reset link lands in your inbox within a
                minute.
              </p>
            </div>
          </Reveal>

          <div className="mt-6">
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              delay={160}
            />
          </div>

          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <SubmitButton
            busy={busy}
            idleLabel="Send reset link"
            busyLabel="Sending…"
            successLabel="Sent"
            icon={<MailCheck className="h-4 w-4" />}
            delay={230}
          />
        </>
      )}
    </form>
  );
}

/* ── set a new password ────────────────────────────────────── */

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
    <form
      onSubmit={submit}
      className="glass p-6 sm:p-7"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {done ? (
        <SuccessMark title="Password updated" blurb="Taking you to sign in…" />
      ) : (
        <>
          <Reveal delay={60}>
            <div>
              <p className="mono-sm text-accent">Almost there</p>
              <h1 className="headline mt-2 text-2xl text-ash-50">Choose a new password</h1>
            </div>
          </Reveal>

          <div className="mt-6 space-y-4">
            <Field
              id="password"
              label="New password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              reveal
              delay={140}
              hint={<StrengthMeter password={password} />}
            />
            <Field
              id="confirm"
              label="Confirm password"
              required
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              reveal
              delay={210}
              hint={
                confirm && confirm !== password ? (
                  <p className="mono-sm mt-1.5 text-red-300">Passwords don&apos;t match yet</p>
                ) : null
              }
            />
          </div>

          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <SubmitButton
            busy={busy}
            idleLabel="Set new password"
            busyLabel="Saving…"
            successLabel="Saved"
            icon={<CheckCircle2 className="h-4 w-4" />}
            delay={280}
          />
        </>
      )}
    </form>
  );
}
