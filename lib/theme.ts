/**
 * Theme engine — the adjustable colour system.
 *
 * Everything the storefront paints with comes from a small set of CSS custom
 * properties written onto <html>. This module is the single source of truth for
 * those values, so the server (a producer's brand colour saved in Settings),
 * the no-flash bootstrap script and the client picker all agree.
 *
 * Pure functions only: safe to import from a server component, a client
 * component or a plain <script> body.
 */

export type SurfaceId = "ink" | "obsidian" | "slate" | "moss";

export type ThemeState = {
  /** Base accent colour, 6-digit hex. The "500" stop of the ramp. */
  accent: string;
  /** Tint of the dark surfaces the whole site sits on. */
  surface: SurfaceId;
  /** 0–100. How much the accent is allowed to glow / bloom. */
  glow: number;
  /** 0–18px. Corner radius used by cards, buttons, inputs and chips. */
  radius: number;
  /** Full motion, or a calmer site (animations still run, just instantly). */
  motion: boolean;
};

export const THEME_STORAGE_KEY = "nso:theme:v12";

export const DEFAULT_THEME: ThemeState = {
  accent: "#e23108",
  surface: "ink",
  glow: 46,
  radius: 2,
  motion: true,
};

export type AccentPreset = { id: string; label: string; hex: string; note: string };

/** Producer-friendly starting points. Anything else can be mixed by hand. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "vermilion", label: "Vermilion", hex: "#e23108", note: "The house red" },
  { id: "sunset", label: "Sunset", hex: "#f97316", note: "Warm orange" },
  { id: "gold", label: "Gold", hex: "#e0a020", note: "Highlife brass" },
  { id: "lime", label: "Lime", hex: "#a3e635", note: "Electric" },
  { id: "emerald", label: "Emerald", hex: "#10b981", note: "Cool green" },
  { id: "cyan", label: "Lagoon", hex: "#06b6d4", note: "Bright teal" },
  { id: "azure", label: "Azure", hex: "#3b82f6", note: "Studio blue" },
  { id: "violet", label: "Violet", hex: "#8b5cf6", note: "Late night" },
  { id: "magenta", label: "Magenta", hex: "#ec4899", note: "Loud pink" },
  { id: "mono", label: "Bone", hex: "#d9d5c8", note: "No colour at all" },
];

export type SurfacePreset = {
  id: SurfaceId;
  label: string;
  note: string;
  /** Hue/saturation used to build the ink ramp; lightness ladder is shared. */
  hue: number;
  sat: number;
  paper: string;
  paperLine: string;
};

export const SURFACES: SurfacePreset[] = [
  { id: "ink", label: "Ink", note: "Warm near-black", hue: 45, sat: 9, paper: "#f3f0e7", paperLine: "#cdc7b7" },
  { id: "obsidian", label: "Obsidian", note: "Neutral black", hue: 250, sat: 6, paper: "#f0f0f2", paperLine: "#c9c9d0" },
  { id: "slate", label: "Slate", note: "Cool blue-grey", hue: 214, sat: 17, paper: "#eef2f6", paperLine: "#c3ccd6" },
  { id: "moss", label: "Moss", note: "Deep green", hue: 158, sat: 13, paper: "#eef2ea", paperLine: "#c6cfc0" },
];

/* ── colour maths ───────────────────────────────────────────── */

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const clean = normalizeHex(hex) ?? DEFAULT_THEME.accent;
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16),
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslCss(h: number, s: number, l: number, alpha = 1): string {
  const hh = Math.round(((h % 360) + 360) % 360);
  const ss = Math.round(clamp(s, 0, 1) * 100);
  const ll = Math.round(clamp(l, 0, 1) * 100);
  if (alpha >= 1) return `hsl(${hh} ${ss}% ${ll}%)`;
  return `hsl(${hh} ${ss}% ${ll}% / ${Number(alpha.toFixed(3))})`;
}

/** WCAG-ish relative luminance of a hex colour, 0 (black) → 1 (white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Ink or paper, whichever stays legible on top of `hex`. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.42 ? "#121110" : "#f7f5ef";
}

/* ── ramps ──────────────────────────────────────────────────── */

/** Accent stops, relative to whatever base colour was chosen. */
const ACCENT_STOPS: { stop: number; dl: number; satMul: number; max: number }[] = [
  { stop: 200, dl: 0.34, satMul: 0.82, max: 0.93 },
  { stop: 300, dl: 0.19, satMul: 0.95, max: 0.86 },
  { stop: 400, dl: 0.07, satMul: 1, max: 0.8 },
  { stop: 500, dl: 0, satMul: 1, max: 1 },
  { stop: 600, dl: -0.08, satMul: 1, max: 1 },
  { stop: 700, dl: -0.19, satMul: 0.92, max: 1 },
];

/** Lightness ladder shared by every dark surface (matches the original ink set). */
const INK_LADDER: { stop: number; l: number }[] = [
  { stop: 950, l: 0.043 },
  { stop: 900, l: 0.065 },
  { stop: 850, l: 0.084 },
  { stop: 800, l: 0.108 },
  { stop: 700, l: 0.159 },
  { stop: 600, l: 0.222 },
];

export function surfacePreset(id: SurfaceId | string): SurfacePreset {
  return SURFACES.find((s) => s.id === id) ?? SURFACES[0];
}

/** Accent ramp: `--accent-200` … `--accent-700`, plus derived helper vars. */
export function accentVars(hex: string, glow = DEFAULT_THEME.glow): Record<string, string> {
  const base = rgbToHsl(hexToRgb(hex));
  const vars: Record<string, string> = {};
  for (const { stop, dl, satMul, max } of ACCENT_STOPS) {
    const l = stop === 500 ? clamp(base.l, 0.18, 0.82) : clamp(base.l + dl, 0.06, max);
    vars[`--accent-${stop}`] = hslCss(base.h, base.s * satMul, l);
  }
  const mid = rgbToHsl(hexToRgb(vars["--accent-500"] ? hexToHexSafe(vars["--accent-500"]) : hex));
  const contrast = readableOn(hex);
  const alpha = Number((0.2 + (clamp(glow, 0, 100) / 100) * 0.55).toFixed(3));
  const soft = Number((0.06 + (clamp(glow, 0, 100) / 100) * 0.22).toFixed(3));

  vars["--accent"] = vars["--accent-500"];
  vars["--accent-on"] = contrast;
  vars["--accent-glow"] = hslCss(mid.h, mid.s, mid.l, alpha);
  vars["--accent-soft"] = hslCss(mid.h, mid.s, mid.l, soft);
  vars["--accent-hue"] = String(Math.round(mid.h));
  vars["--accent-sat"] = `${Math.round(mid.s * 100)}%`;
  vars["--glow"] = String(clamp(glow, 0, 100));
  return vars;
}

/**
 * `hsl(h s% l%)` → hex. Needed because we build stops as CSS strings but want
 * to measure the lightest/darkest one for contrast decisions.
 */
function hexToHexSafe(css: string): string {
  const match = css.match(/hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!match) return css;
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Ink ramp + glass values for a surface preset. */
export function surfaceVars(id: SurfaceId | string): Record<string, string> {
  const preset = surfacePreset(id);
  const vars: Record<string, string> = {};
  for (const { stop, l } of INK_LADDER) {
    vars[`--ink-${stop}`] = hslCss(preset.hue, preset.sat / 100, l);
  }
  const glassBase = preset.hue;
  vars["--surface"] = vars["--ink-950"];
  vars["--line"] = vars["--ink-700"];
  vars["--paper"] = preset.paper;
  vars["--paper-2"] = hslCss(preset.hue, Math.min(preset.sat, 12) / 100, 0.87);
  vars["--paper-line"] = preset.paperLine;
  vars["--glass-bg"] = hslCss(glassBase, (preset.sat + 4) / 100, 0.09, 0.52);
  vars["--glass-bg-strong"] = hslCss(glassBase, (preset.sat + 4) / 100, 0.075, 0.78);
  vars["--glass-border"] = hslCss(preset.hue, 28, 0.92, 0.11);
  vars["--glass-highlight"] = hslCss(preset.hue, 20, 0.98, 0.06);
  vars["--glass-shadow"] = `0 20px 60px -25px hsl(${preset.hue} ${preset.sat}% 2% / 0.85)`;
  return vars;
}

/** The complete variable set for a theme — this is what gets written to <html>. */
export function themeVars(theme: ThemeState): Record<string, string> {
  const radius = clamp(theme.radius ?? DEFAULT_THEME.radius, 0, 18);
  return {
    ...accentVars(theme.accent, theme.glow),
    ...surfaceVars(theme.surface),
    "--radius-ui": `${radius}px`,
    "--radius-card": `${radius + 2}px`,
    "--glow-blur": `${Math.round(10 + (clamp(theme.glow, 0, 100) / 100) * 60)}px`,
    // A scale of ~0 finishes every entrance animation instantly, so nothing
    // is left invisible when motion is switched off — it just snaps into place.
    "--motion-scale": theme.motion === false ? "0.001" : "1",
    "--loop-play": theme.motion === false ? "paused" : "running",
  };
}

/** Inline style object for SSR — React wants its own type but accepts vars. */
export function themeStyle(theme: ThemeState): React.CSSProperties {
  return themeVars(theme) as unknown as React.CSSProperties;
}

export function cssVarsToText(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

/** Read the producer's saved brand colour out of the settings map. */
export function themeFromSettings(settings: Record<string, string>): ThemeState {
  const accent = normalizeHex(settings.theme_accent ?? "") ?? DEFAULT_THEME.accent;
  const surface = (SURFACES.find((s) => s.id === settings.theme_surface)?.id ??
    DEFAULT_THEME.surface) as SurfaceId;
  const glow = clamp(Number(settings.theme_glow ?? DEFAULT_THEME.glow) || 0, 0, 100);
  const radius = clamp(Number(settings.theme_radius ?? DEFAULT_THEME.radius) || 0, 0, 18);
  const motion = settings.theme_motion !== "false";
  return { accent, surface, glow, radius, motion };
}

export function isThemeState(value: unknown): value is ThemeState {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<ThemeState>;
  return typeof t.accent === "string" && typeof t.surface === "string";
}

export function sanitizeTheme(value: Partial<ThemeState> | null | undefined): ThemeState {
  return {
    accent: normalizeHex(String(value?.accent ?? "")) ?? DEFAULT_THEME.accent,
    surface: (SURFACES.find((s) => s.id === value?.surface)?.id ?? DEFAULT_THEME.surface) as SurfaceId,
    glow: clamp(Number(value?.glow ?? DEFAULT_THEME.glow) || 0, 0, 100),
    radius: clamp(Number(value?.radius ?? DEFAULT_THEME.radius) || 0, 0, 18),
    motion: value?.motion !== false,
  };
}
