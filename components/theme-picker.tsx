"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Palette, RotateCcw, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  ACCENT_PRESETS,
  DEFAULT_THEME,
  SURFACES,
  hexToRgb,
  normalizeHex,
  readableOn,
} from "@/lib/theme";
import { cn, cssVars } from "@/lib/utils";

/* ── labelled slider ───────────────────────────────────────── */
function Slider({
  label,
  value,
  min,
  max,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-center justify-between">
        <span className="mono-sm text-ash-400">{label}</span>
        <span className="mono-sm nums text-ash-300">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-accent mt-3 w-full"
        style={cssVars({ "--fill": `${fill}%` })}
      />
    </label>
  );
}

/** Miniature ink-ladder preview so each backdrop reads as a swatch. */
function surfacePreview(id: string): string[] {
  const presets: Record<string, string[]> = {
    ink: ["#0b0b0a", "#171614", "#2c2b25", "#3d3b33"],
    obsidian: ["#0a0a0c", "#151518", "#26262b", "#34343b"],
    slate: ["#080b0f", "#131820", "#232c36", "#313d49"],
    moss: ["#080d0a", "#121a15", "#202d25", "#2d3d33"],
  };
  return presets[id] ?? presets.ink;
}

/**
 * The colour controls. Mounted twice: in the floating launcher (a visitor can
 * restyle the storefront for themselves) and in Admin → Settings (the producer
 * picks the default everyone else sees).
 */
export function ThemePickerPanel({
  onDone,
  className,
}: {
  onDone?: () => void;
  className?: string;
}) {
  const { theme, setTheme, studioTheme, customised, reset } = useTheme();
  const [hexDraft, setHexDraft] = useState(theme.accent);
  const [lastAccent, setLastAccent] = useState(theme.accent);

  // Keep the text field in step with the theme when it changes from elsewhere
  // (preset click, the colour wheel, another tab) — adjusted during render.
  if (lastAccent !== theme.accent) {
    setLastAccent(theme.accent);
    setHexDraft(theme.accent);
  }

  const activePreset = useMemo(
    () => ACCENT_PRESETS.find((preset) => preset.hex.toLowerCase() === theme.accent.toLowerCase()),
    [theme.accent],
  );

  function commitHex(value: string) {
    setHexDraft(value);
    const hex = normalizeHex(value);
    if (hex) setTheme({ accent: hex });
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <p className="mono-sm text-ash-400">Spot colour</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const active = preset.hex.toLowerCase() === theme.accent.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                title={`${preset.label} — ${preset.note}`}
                aria-label={`${preset.label} (${preset.note})`}
                aria-pressed={active}
                onClick={() => setTheme({ accent: preset.hex })}
                data-active={active}
                className="swatch grid place-items-center"
                style={{ background: preset.hex, color: readableOn(preset.hex) }}
              >
                {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
        <p className="mono-sm mt-2 text-ash-500">
          {activePreset ? `${activePreset.label} · ${activePreset.note}` : "Custom mix"}
        </p>
      </div>

      <div>
        <p className="mono-sm text-ash-400">Mix your own</p>
        <div className="mt-3 flex items-center gap-2">
          <label
            className="relative h-10 w-12 shrink-0 cursor-pointer border border-ink-600"
            style={{ background: theme.accent, borderRadius: "var(--radius-ui)" }}
            title="Open the colour wheel"
          >
            <input
              type="color"
              value={theme.accent}
              onChange={(event) => commitHex(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick a custom colour"
            />
          </label>
          <input
            type="text"
            value={hexDraft}
            spellCheck={false}
            onChange={(event) => commitHex(event.target.value)}
            onBlur={() => setHexDraft(theme.accent)}
            className="input !py-2 font-mono text-xs uppercase"
            aria-label="Hex colour"
          />
        </div>
      </div>

      <div>
        <p className="mono-sm text-ash-400">Backdrop</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {SURFACES.map((surface) => {
            const active = surface.id === theme.surface;
            return (
              <button
                key={surface.id}
                type="button"
                title={`${surface.label} — ${surface.note}`}
                aria-label={`${surface.label} — ${surface.note}`}
                aria-pressed={active}
                onClick={() => setTheme({ surface: surface.id })}
                className={cn(
                  "group relative overflow-hidden border p-2 text-left transition-transform",
                  active ? "border-accent" : "border-ink-700 hover:-translate-y-0.5",
                )}
                style={{ borderRadius: "var(--radius-ui)" }}
              >
                <span className="flex gap-0.5" aria-hidden>
                  {surfacePreview(surface.id).map((color) => (
                    <span key={color} className="h-5 flex-1" style={{ background: color }} />
                  ))}
                </span>
                <span
                  className={cn(
                    "mono-sm mt-2 block",
                    active ? "text-accent-300" : "text-ash-500 group-hover:text-ash-300",
                  )}
                >
                  {surface.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5 border-t border-ink-700 pt-5">
        <Slider
          label="Glow"
          value={theme.glow}
          min={0}
          max={100}
          onChange={(glow) => setTheme({ glow })}
        />
        <Slider
          label="Corners"
          value={theme.radius}
          min={0}
          max={18}
          suffix="px"
          onChange={(radius) => setTheme({ radius })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 pt-5">
        <button
          type="button"
          onClick={() => setTheme({ motion: !theme.motion })}
          aria-pressed={theme.motion}
          className="flex items-center gap-2 text-left"
        >
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
              theme.motion ? "border-accent bg-accent/30" : "border-ink-600 bg-ink-800",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ash-50 transition-all",
                theme.motion ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
          <span className="mono-sm text-ash-400">
            {theme.motion ? "Animation on" : "Calm mode"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            reset();
            onDone?.();
          }}
          disabled={!customised}
          className="btn btn-secondary btn-sm"
          title="Go back to the colour saved in the studio settings"
        >
          <RotateCcw className="h-3 w-3" /> Studio default
        </button>
      </div>

      <p className="mono-sm leading-relaxed text-ash-500">
        {customised ? "Saved in this browser. The studio default is " : "Studio default is "}
        <span className="text-ash-300">{studioTheme.accent}</span>
        {customised ? "." : " — open Colour to make it yours."}
      </p>
    </div>
  );
}

/**
 * Floating launcher. Bottom-left so it clears the cart drawer (right) and the
 * sticky player transport (bottom).
 */
export function ThemeLauncher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { customised } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // The admin has its own colour controls (Settings → Studio colour).
  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      ref={panelRef}
      className="pointer-events-none fixed bottom-24 left-4 z-40 flex flex-col items-start gap-3 sm:bottom-28 sm:left-6"
    >
      {open && (
        <div className="sheet-in glass-strong pointer-events-auto w-[19rem] max-w-[calc(100vw-2rem)] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mono-sm text-accent">Studio colour</p>
              <p className="headline mt-1 text-sm text-ash-50">Make it yours</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ash-500 transition-colors hover:text-ash-100"
              aria-label="Close colour panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ThemePickerPanel onDone={() => setOpen(false)} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Adjust the site colour"
        className={cn(
          "group glass pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 transition-all hover:-translate-y-0.5",
          open && "glass-strong",
        )}
        style={{ borderRadius: "var(--radius-ui)" }}
      >
        <Palette className="h-4 w-4 text-accent transition-transform group-hover:rotate-12" />
        <span className="mono-sm hidden text-ash-200 sm:block">Colour</span>
        {customised && (
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} aria-hidden />
        )}
      </button>
    </div>
  );
}

/** Read-only chip used in the admin settings preview. */
export function AccentChip({ accent }: { accent: string }) {
  const hex = normalizeHex(accent) ?? DEFAULT_THEME.accent;
  const { r, g, b } = hexToRgb(hex);
  return (
    <span className="chip" style={{ borderColor: hex }}>
      <span className="h-2.5 w-2.5" style={{ background: hex, borderRadius: 1 }} />
      <span className="nums" style={{ color: hex }}>
        rgb({r} {g} {b})
      </span>
    </span>
  );
}
