"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Pause,
  ShoppingBag,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { usePlayer } from "@/components/player-provider";
import { cn, cssVars } from "@/lib/utils";

type Props = {
  settings: Record<string, string>;
  user: { name: string; role: string } | null;
};

const LINKS = [
  { href: "/beats", label: "Beats" },
  { href: "/videos", label: "Videos" },
  { href: "/studio", label: "Studio" },
  { href: "/licensing", label: "Licensing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const TICKER_ITEMS = (settings: Record<string, string>) => [
  settings.announcement,
  "MP3 · WAV · Trackout",
  "Mobile money · Bank · Card",
  "Licence PDF with every order",
  "Accra → worldwide",
];

/** Printed label mark — a spindle and a record. Drawn, not icon-library. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className} fill="none">
      <rect x="0.5" y="0.5" width="27" height="27" stroke="currentColor" />
      <circle cx="14" cy="14" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <circle cx="14" cy="5.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function Ticker({ items }: { items: string[] }) {
  return (
    <div className="ticker" aria-hidden>
      {/* two identical copies: the track scrolls exactly -50% for a seamless loop */}
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="items-center">
            {items.map((item, i) => (
              <span key={`${copy}-${i}`} className="mono-sm flex items-center text-ash-400">
                <span className="px-4 py-2">{item}</span>
                <span className="text-accent-500">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Scroll telemetry for the header: how far down we are, reading progress, and
 * whether we are travelling down (so the bar can step out of the way) or up
 * (so it can come back). One rAF-throttled listener for the whole app.
 */
function useScrollState() {
  const [state, setState] = useState({ y: 0, progress: 0, down: false, scrolled: false });
  const last = useRef(0);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const delta = y - last.current;
      // ignore jitter (rubber-banding, sub-pixel moves, small backtracking)
      if (Math.abs(delta) > 6) {
        setState({
          y,
          progress: max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0,
          down: delta > 0 && y > 260,
          scrolled: y > 24,
        });
        last.current = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}

/** The track playing right now, surfaced in the bar itself. */
function NowPlaying() {
  const { current, playing, pause, resume } = usePlayer();
  if (!current) return null;
  return (
    <button
      type="button"
      onClick={() => (playing ? pause() : resume())}
      className="group hidden max-w-[15rem] items-center gap-2.5 px-2.5 py-1.5 transition-colors md:flex xl:max-w-[18rem]"
      style={{ borderRadius: "var(--radius-ui)" }}
      title={playing ? "Pause preview" : "Resume preview"}
    >
      <span className="flex h-4 items-end gap-[2px] text-accent" aria-hidden>
        <span className="vis" data-playing={playing}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="h-full" />
          ))}
        </span>
      </span>
      <span className="min-w-0 text-left">
        <span className="mono-sm block truncate text-ash-200">{current.title}</span>
      </span>
      {playing ? (
        <Pause className="h-3 w-3 shrink-0 text-ash-500 group-hover:text-accent" />
      ) : (
        <span className="mono-sm shrink-0 text-ash-500 group-hover:text-accent">▶</span>
      )}
    </button>
  );
}

export function SiteHeader({ settings, user }: Props) {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const { down, scrolled, progress } = useScrollState();

  const activeHref =
    LINKS.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))?.href ??
    null;

  // Close menus when the route changes (covers browser back/forward).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  /* ── the sliding nav indicator ─────────────────────────────── */
  const measure = useCallback(() => {
    const target = hovered ?? activeHref;
    const link = target ? linkRefs.current[target] : null;
    const nav = navRef.current;
    if (!link || !nav) {
      setIndicator((current) => ({ ...current, opacity: 0 }));
      return;
    }
    const linkBox = link.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    setIndicator({
      left: linkBox.left - navBox.left,
      width: linkBox.width,
      opacity: 1,
    });
  }, [hovered, activeHref]);

  useEffect(() => {
    measure();
  }, [measure, pathname]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!mobileOpen && !menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [mobileOpen, menuOpen]);

  // Lock the page behind the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // The storefront chrome stays out of the way on admin + checkout screens.
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  const tucked = down && !mobileOpen && !menuOpen;

  return (
    <>
      {/* ── utility strip: collapses out of the way as you scroll ─── */}
      <div
        className={cn(
          "hidden overflow-hidden border-b bg-ink-950 transition-all duration-500 md:block",
          scrolled ? "max-h-0 border-transparent opacity-0" : "max-h-10 border-ink-700 opacity-100",
        )}
      >
        <div className="container-page flex h-8 items-center justify-between">
          <p className="mono-sm text-ash-500">
            Accra, Ghana · GMT
            <span className="mx-2 text-ink-600">/</span>
            <span className="text-ash-300">{settings.support_phone}</span>
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${settings.support_email}`}
              className="mono-sm text-ash-500 transition-colors hover:text-accent"
            >
              {settings.support_email}
            </a>
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="mono-sm underline-slide text-ash-500 transition-colors hover:text-accent"
              >
                Instagram
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mono-sm underline-slide text-ash-500 transition-colors hover:text-accent"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── the bar itself: glass, compressible, self-hiding ───────── */}
      <header
        data-scrolled={scrolled}
        className={cn(
          "glass glass-hairline sticky top-0 z-40 transition-all duration-500 will-change-transform",
          tucked ? "-translate-y-full" : "translate-y-0",
          scrolled && "glass-strong",
        )}
        style={cssVars({ "--d": "0ms" })}
      >
        <div
          className={cn(
            "container-page flex items-center gap-6 transition-all duration-500",
            scrolled ? "h-14" : "h-16",
          )}
        >
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label={settings.site_name}
          >
            <span className="relative">
              <Mark
                className={cn(
                  "text-accent-500 transition-all duration-500 group-hover:text-accent-300",
                  scrolled ? "h-6 w-6" : "h-7 w-7",
                )}
              />
              <span
                className="absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "var(--accent-glow)", filter: "blur(12px)" }}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "display leading-none text-ash-50 transition-all duration-500",
                scrolled ? "text-[17px]" : "text-[19px]",
              )}
            >
              {settings.site_name}
            </span>
          </Link>

          <nav
            ref={navRef}
            className="relative ml-auto hidden items-center gap-6 lg:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(node) => {
                    linkRefs.current[link.href] = node;
                  }}
                  onMouseEnter={() => setHovered(link.href)}
                  onFocus={() => setHovered(link.href)}
                  data-active={isActive}
                  className={cn(
                    "mono py-1 transition-colors",
                    isActive ? "text-accent" : "text-ash-300 hover:text-ash-50",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {/* one element glides between links instead of six underlines */}
            <span
              className="pointer-events-none absolute -bottom-0.5 h-px bg-accent transition-all duration-300"
              style={{
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.opacity,
                transitionTimingFunction: "var(--ease-out-quint)",
              }}
              aria-hidden
            />
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <NowPlaying />

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-secondary btn-sm !px-3"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {/* keyed on count so the badge pops whenever it changes */}
              <span
                key={count}
                className={cn("nums pop-in", count > 0 && "text-accent-300")}
                style={cssVars({ "--d": "0ms" })}
              >
                {count}
              </span>
            </button>

            {user ? (
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-expanded={menuOpen}
                  className={cn(
                    "mono flex items-center gap-1.5 border px-3 py-2 transition-all",
                    menuOpen
                      ? "border-accent text-ash-50"
                      : "border-ink-600 text-ash-200 hover:border-ash-300 hover:text-ash-50",
                  )}
                  style={{ borderRadius: "var(--radius-ui)" }}
                >
                  {user.name.split(" ")[0]}
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", menuOpen && "rotate-180")}
                  />
                </button>
                {menuOpen && (
                  <div
                    className="sheet-in glass-strong absolute right-0 z-50 mt-2 w-56 overflow-hidden"
                    style={{ borderRadius: "var(--radius-card)" }}
                  >
                    <div className="border-b border-ink-700 px-3 py-2">
                      <p className="mono-sm text-ash-500">Signed in as</p>
                      <p className="truncate text-sm text-ash-100">{user.name}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-accent/10 hover:text-ash-50"
                    >
                      <Headphones className="h-4 w-4" /> My beats
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-accent/10 hover:text-ash-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-accent/10 hover:text-ash-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href="/login" className="btn btn-ghost btn-sm underline-slide">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm sheen">
                  Create account
                </Link>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm !px-2.5 lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* reading progress lives on the bar's bottom edge */}
        <span
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-opacity duration-300"
          style={{ transform: `scaleX(${progress})`, opacity: scrolled ? 1 : 0 }}
          aria-hidden
        />
      </header>

      {/* ── mobile drawer: full-height glass panel ─────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 top-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="overlay-in absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />
          <nav
            className="glass-strong sheet-in absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto pt-20 pb-10"
            style={{ borderRadius: 0 }}
          >
            <div className="container-page stagger grid gap-1">
              {LINKS.map((link) => {
                const isActive = activeHref === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between border-b border-ink-700/60 py-3.5 transition-colors",
                      isActive ? "text-accent" : "text-ash-200 hover:text-ash-50",
                    )}
                  >
                    <span className="headline text-lg">{link.label}</span>
                    <span className="mono-sm text-ash-600">0{LINKS.indexOf(link) + 1}</span>
                  </Link>
                );
              })}

              <div className="mt-5 flex gap-2">
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      My beats
                    </Link>
                    <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn btn-primary btn-sm flex-1 sheen"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* the ticker belongs to the top of the page only */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500",
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
        )}
      >
        <Ticker items={TICKER_ITEMS(settings)} />
      </div>
    </>
  );
}
