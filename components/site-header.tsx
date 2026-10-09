"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X, LogOut, LayoutDashboard, User, Headphones } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

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

export function SiteHeader({ settings, user }: Props) {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // ── dynamic glass: reacts to scroll ───────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // ── cursor-tracked specular glow (ref-mutated, no re-renders) ──
  const glowRef = useRef<HTMLDivElement>(null);

  function trackGlow(event: React.MouseEvent<HTMLElement>) {
    const glow = glowRef.current;
    if (!glow) return;
    const rect = event.currentTarget.getBoundingClientRect();
    glow.style.transform = `translateX(calc(${event.clientX - rect.left}px - 50%))`;
    glow.style.opacity = "1";
  }

  function hideGlow() {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }

  // ── sliding nav pill: rests on the active link, follows hover ──
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [measureTick, setMeasureTick] = useState(0);
  const activeIndex = LINKS.findIndex(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`)
  );
  const pillIndex = hoverIndex ?? activeIndex;
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const el = pillIndex != null && pillIndex >= 0 ? linkRefs.current[pillIndex] : null;
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
    } else {
      setPill((p) => ({ ...p, visible: false }));
    }
  }, [pillIndex, measureTick]);

  useEffect(() => {
    const remeasure = () => setMeasureTick((t) => t + 1);
    window.addEventListener("resize", remeasure);
    document.fonts?.ready?.then(remeasure).catch(() => {});
    return () => window.removeEventListener("resize", remeasure);
  }, []);

  // ── user dropdown with exit animation ─────────────────────
  function openMenu() {
    setMenuClosing(false);
    setMenuMounted(true);
    setMenuOpen(true);
  }

  function closeMenu() {
    if (!menuOpen) return;
    setMenuClosing(true);
    window.setTimeout(() => {
      setMenuMounted(false);
      setMenuOpen(false);
      setMenuClosing(false);
    }, 150);
  }

  // Close menus when the route changes (covers browser back/forward).
  // "Adjust state during render" pattern — no effect needed.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
    setMenuMounted(false);
    setMenuClosing(false);
  }

  useEffect(() => {
    if (!mobileOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen, menuOpen]);

  // The storefront chrome stays out of the way on admin + checkout screens.
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    closeMenu();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      onMouseMove={trackGlow}
      onMouseLeave={() => {
        hideGlow();
        setHoverIndex(null);
      }}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-ink-700/60 bg-ink-900/70 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          : "border-transparent bg-ink-900/40 backdrop-blur-md"
      )}
    >
      {/* glass specular line along the top edge */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0"
        )}
      />

      {/* cursor-tracked glow — only on fine pointers */}
      <div
        ref={glowRef}
        aria-hidden
        style={{ transform: "translateX(-50%)", opacity: 0 }}
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-72 bg-[radial-gradient(closest-side,rgba(163,230,53,0.09),transparent)] opacity-0 transition-opacity duration-500 [@media(pointer:fine)]:block"
      />

      <div className="container-page relative flex h-16 items-center gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={settings.site_name}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-ink-950 shadow-[0_0_0_0_rgba(163,230,53,0)] transition-all duration-300 group-hover:shadow-[0_0_18px_rgba(163,230,53,0.45)]">
            <Headphones
              className="h-4.5 w-4.5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
              strokeWidth={2.5}
            />
          </span>
          <span className="text-[15px] font-bold tracking-tight">{settings.site_name}</span>
        </Link>

        <nav
          className="relative ml-4 hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <span
            aria-hidden
            style={{ left: pill.left, width: pill.width }}
            className={cn(
              "absolute top-1/2 h-9 -translate-y-1/2 rounded-full border border-ink-700/70 bg-ink-800/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              "transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.5,1)]",
              pill.visible ? "opacity-100" : "opacity-0"
            )}
          />
          {LINKS.map((link, i) => {
            const isActive = i === activeIndex;
            return (
              <Link
                key={link.href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                href={link.href}
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                className={cn(
                  "relative z-10 rounded-full px-3 py-2 text-sm transition-colors duration-200",
                  isActive ? "text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary btn-sm relative"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span
                key={count}
                className="animate-pop absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[11px] font-bold text-ink-950"
              >
                {count}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
                aria-expanded={menuOpen}
                className="btn btn-secondary btn-sm"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-24 truncate sm:inline">
                  {user.name.split(" ")[0]}
                </span>
              </button>
              {menuMounted && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={closeMenu}
                  />
                  <div
                    className={cn(
                      "absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/95 p-1.5 shadow-2xl backdrop-blur-xl",
                      menuClosing ? "animate-menu-out" : "animate-menu-in"
                    )}
                  >
                    <div className="px-3 py-2 text-xs text-zinc-500">
                      Signed in as
                      <div className="truncate text-sm text-zinc-200">{user.name}</div>
                    </div>
                    <Link
                      href="/account"
                      onClick={closeMenu}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-ink-800 hover:text-white"
                    >
                      <Headphones className="h-4 w-4" /> My beats
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-ink-800 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-ink-800 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* scroll progress */}
      <div
        aria-hidden
        style={{ width: `${progress * 100}%`, opacity: scrolled ? 1 : 0 }}
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-lime-300 to-emerald-400 transition-[width,opacity] duration-150 ease-out"
      />

      {/* ── mobile menu (height-animated, staggered links) ────── */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <nav className="grid gap-1 border-t border-ink-700/60 bg-ink-900/80 px-4 py-3 backdrop-blur-xl">
            {LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{ transitionDelay: mobileOpen ? `${80 + i * 45}ms` : "0ms" }}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm transition-[opacity,transform] duration-300",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "bg-ink-800 text-white"
                    : "text-zinc-300 hover:bg-ink-800 hover:text-white",
                  mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                )}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div
                style={{ transitionDelay: mobileOpen ? `${80 + LINKS.length * 45}ms` : "0ms" }}
                className={cn(
                  "mt-2 grid grid-cols-2 gap-2 transition-all duration-300",
                  mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                )}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary btn-sm"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
