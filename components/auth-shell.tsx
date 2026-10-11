import { Check } from "lucide-react";

type Props = {
  eyebrow: string;
  title: string;
  blurb: string;
  bullets: string[];
  children: React.ReactNode;
};

/**
 * Split-screen shell shared by the auth pages. Left column is the pitch,
 * right column is the form. No orbs, no glow — just type on ink.
 */
export function AuthShell({ eyebrow, title, blurb, bullets, children }: Props) {
  return (
    <div className="container-page">
      <div className="grid items-stretch gap-12 py-14 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16 lg:py-20">
        <aside className="hidden flex-col justify-between border border-ink-700 bg-ink-850 p-10 lg:flex">
          <div>
            <p className="mono-sm text-accent">{eyebrow}</p>
            <h2 className="headline mt-5 text-3xl text-ash-50 xl:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ash-400">{blurb}</p>

            <ul className="mt-8 border-t border-ink-700">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 border-b border-ink-700 py-3 text-sm text-ash-300"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-accent-600 bg-accent-600/20">
                    <Check className="h-3 w-3 text-accent-300" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* printed waveform strip */}
          <div className="mt-12 flex h-20 items-end gap-[3px]" aria-hidden>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 18 + ((i * 37) % 78);
              return (
                <span
                  key={i}
                  className="flex-1 bg-ink-600"
                  style={{ height: `${h}%`, opacity: i % 3 === 0 ? 1 : 0.45 }}
                />
              );
            })}
          </div>
        </aside>

        <div className="flex items-center">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
