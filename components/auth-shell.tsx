import { Check, Headphones } from "lucide-react";

type Props = {
  eyebrow: string;
  title: string;
  blurb: string;
  bullets: string[];
  children: React.ReactNode;
};

/**
 * Split-screen shell shared by the auth pages. The left panel is pure CSS
 * motion (orbs, spinning vinyl, equaliser bars, staggered bullets) so it
 * stays a server component; the right column hosts the form.
 */
export function AuthShell({ eyebrow, title, blurb, bullets, children }: Props) {
  return (
    <div className="relative overflow-hidden">
      {/* ambient glow bleeding behind both columns */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 65%)" }}
      />

      <div className="container-page relative">
        <div className="grid items-stretch gap-10 py-14 lg:grid-cols-[1.05fr_minmax(0,480px)] lg:gap-14 lg:py-20">
          {/* ── visual panel ─────────────────────────────────── */}
          <aside className="animate-panel-in relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-ink-700/70 bg-ink-850/60 p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex">
            <div
              aria-hidden
              className="animate-float pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-lime-400/15 blur-3xl"
            />
            <div
              aria-hidden
              className="animate-float pointer-events-none absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl"
              style={{ animationDelay: "-3s" }}
            />

            <div className="relative">
              <span className="chip chip-accent">
                <Headphones className="h-3.5 w-3.5" /> {eyebrow}
              </span>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
                {title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">{blurb}</p>

              <ul className="mt-8 space-y-3.5">
                {bullets.map((bullet, i) => (
                  <li
                    key={bullet}
                    className="animate-field-in flex items-center gap-3 text-sm text-zinc-300"
                    style={{ animationDelay: `${350 + i * 110}ms` }}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-lime-400/30 bg-lime-400/10">
                      <Check className="h-3.5 w-3.5 text-lime-300" strokeWidth={3} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* vinyl + equaliser */}
            <div className="relative mt-12 flex items-end justify-between gap-8">
              <div className="relative h-24 w-24 shrink-0">
                <div
                  aria-hidden
                  className="animate-spin-slower absolute inset-0 rounded-full shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg, #16161c 0deg 5deg, #0c0c0f 5deg 10deg)",
                  }}
                >
                  <span className="absolute inset-[30%] rounded-full bg-gradient-to-br from-lime-300 to-emerald-500" />
                  <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-950" />
                </div>
                <div
                  aria-hidden
                  className="absolute -inset-3 -z-10 rounded-full bg-lime-400/10 blur-xl"
                />
              </div>

              <div className="flex h-16 flex-1 items-end justify-end gap-1.5 overflow-hidden" aria-hidden>
                {Array.from({ length: 26 }).map((_, i) => (
                  <span
                    key={i}
                    className="eq-bar"
                    style={{
                      animationDelay: `${(i % 7) * 0.13}s`,
                      animationDuration: `${0.9 + (i % 5) * 0.14}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* ── form column ──────────────────────────────────── */}
          <div className="flex items-center">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
