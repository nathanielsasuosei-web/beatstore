"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeState,
  sanitizeTheme,
  themeVars,
  type ThemeState,
} from "@/lib/theme";

type ThemeContextValue = {
  /** The theme in force right now (visitor choice, or the studio default). */
  theme: ThemeState;
  /** What the producer saved in Settings — used by "studio default". */
  studioTheme: ThemeState;
  /** True when the visitor has overridden the studio colour. */
  customised: boolean;
  setTheme: (patch: Partial<ThemeState>) => void;
  reset: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ══════════════════════════════════════════════════════════════
   localStorage is the store. Everything else reads from it through
   useSyncExternalStore, which keeps SSR honest (the server renders the
   studio theme, the browser then swaps in any saved override) and keeps
   a second tab in step for free.
   ══════════════════════════════════════════════════════════════ */

const listeners = new Set<() => void>();
let snapshot: { raw: string | null; theme: ThemeState | null } | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      snapshot = null;
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ThemeState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { v?: number; theme?: unknown };
    if (parsed?.v !== 12 || !isThemeState(parsed.theme)) return null;
    return sanitizeTheme(parsed.theme);
  } catch {
    return null;
  }
}

/** Cached by the raw string so the returned reference is stable. */
function getSnapshot(): ThemeState | null {
  const raw = readRaw();
  if (!snapshot || snapshot.raw !== raw) snapshot = { raw, theme: parse(raw) };
  return snapshot.theme;
}

function getServerSnapshot(): ThemeState | null {
  return null;
}

function write(theme: ThemeState) {
  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ v: 12, theme, vars: themeVars(theme) }),
    );
  } catch {
    /* private mode — the colour still applies for this session */
  }
  snapshot = null;
  emit();
}

function pushVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
}

export function ThemeProvider({
  studioTheme,
  children,
}: {
  studioTheme: ThemeState;
  children: React.ReactNode;
}) {
  const studio = useMemo(() => sanitizeTheme(studioTheme), [studioTheme]);
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme = stored ?? studio;

  // The theme is the external system here: React owns the value, the document
  // owns the pixels. Writing the variables is the whole point of the provider.
  useEffect(() => {
    pushVars(themeVars(theme));
    document.documentElement.dataset.surface = theme.surface;
  }, [theme]);

  const setTheme = useCallback(
    (patch: Partial<ThemeState>) => {
      const current = getSnapshot() ?? studio;
      write(sanitizeTheme({ ...current, ...patch }));
    },
    [studio],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    snapshot = null;
    emit();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, studioTheme: studio, customised: stored !== null, setTheme, reset }),
    [theme, studio, stored, setTheme, reset],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: DEFAULT_THEME,
      studioTheme: DEFAULT_THEME,
      customised: false,
      setTheme: () => {},
      reset: () => {},
    };
  }
  return context;
}
