import Link from "next/link";
import { Check } from "lucide-react";
import { cn, cssVars } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  blurb: string;
  bullets: string[];
  /** Which tab the sliding thumb should sit under. */
  mode?: "login" | "register" | "none";
  children: React.ReactNode;
};

/**
 * Split-screen shell shared by every auth page.
 *
 * Left: the pitch, on a sheet of animated ink (aurora + a live waveform).
 * Right: the form card. Both animate in — the aside first, the card a beat
 * later — so the page assembles itself instead of appearing all at once.
 * The Sign in / Create account switcher is a link pair with one thumb that
 * slides between them, so tabs work without JavaScript.
 */
export function AuthShell({ eyebrow, title, blurb, bullets, mode = "none", children }: Props) {
  return (
    <div className="relative isolate overflow-hidden">
      {/* ── atmosphere ───────────────────────────────────────── */}
      <div className="aurora" aria-hidden>
        <span className="aurora-blob loop-drift" style={{ animationDelay: "-4s" }} />
        <span className="aurora-blob loop-drift" style={{ animationDelay: "-13s" }} />
      </div>
      <div className="hero-grid" aria-hidden />

      <div className="container-page relative grid items-stretch gap-10 py-12 lg:grid-cols-[1fr_minmax(0,470px)] lg:gap-16 lg:py-20">
        {/* ── the pitch ─────────────────────────────────────── */}
        <aside className="auth-aside glass relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <div>
            <p className="mono-sm flex items-center gap-2.5 text-accent">
              <span className="live-dot" aria-hidden />
              {eyebrow}
            </p>
            <h2 className="display mt-6 text-[clamp(1.75rem,2.6vw,2.5rem)] text-ash-50">{title}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ash-400">{blurb}</p>

            <ul className="stagger mt-9 border-t border-ink-700/70">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 border-b border-ink-700/70 py-3 text-sm text-ash-300"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-accent-600 bg-accent-600/20">
                    <Check className="h-3 w-3 text-accent-300" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* live waveform — the site's signature, still running */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <p className="mono-sm text-ash-500">Now cutting</p>
              <p className="mono-sm nums text-accent">-6.2 dB</p>
            </div>
            <div className="mt-3 h-20 text-accent-500">
              <span className="vis" data-playing="true" aria-hidden>
                {Array.from({ length: 40 }).map((_, index) => (
                  <span key={index} className="h-full" />
                ))}
              </span>
            </div>
          </div>
        </aside>

        {/* ── the form ──────────────────────────────────────── */}
        <div className="flex items-center">
          <div className="w-full">
            {mode !== "none" && <AuthTabs mode={mode} />}
            <div className="auth-card">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sign in ⟷ Create account, with one thumb gliding between the two. */
export function AuthTabs({ mode }: { mode: "login" | "register" }) {
  const items = [
    { href: "/login", label: "Sign in", active: mode === "login" },
    { href: "/register", label: "Create account", active: mode === "register" },
  ];

  return (
    <div
      className="auth-tabs glass mb-5 grid grid-cols-2 p-1"
      data-step={mode === "register" ? "1" : "0"}
      style={{ borderRadius: "var(--radius-ui)" }}
    >
      <span
        className="auth-tab-thumb"
        style={{ borderRadius: "calc(var(--radius-ui) - 1px)" }}
        aria-hidden
      />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "mono relative z-[1] py-2.5 text-center transition-colors duration-300",
            item.active
              ? "text-[color:var(--accent-on)]"
              : "text-ash-400 hover:text-ash-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/**
 * A field that animates itself: the label lifts, a rail draws under the
 * control on focus, and anything passed as `hint` fades in underneath.
 */
export function AuthNote({
  tone,
  children,
  className,
}: {
  tone: "info" | "muted";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mono-sm leading-relaxed",
        tone === "info" ? "text-accent-300" : "text-ash-500",
        className,
      )}
      style={cssVars({ "--d": "420ms" })}
    >
      {children}
    </p>
  );
}
