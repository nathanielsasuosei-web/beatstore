"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X, LogOut, LayoutDashboard, Headphones } from "lucide-react";
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

export function SiteHeader({ settings, user }: Props) {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when the route changes (covers browser back/forward).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [mobileOpen, menuOpen]);

  // The storefront chrome stays out of the way on admin + checkout screens.
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* ── utility strip: where we are, how to reach us ─────── */}
      <div className="hidden border-b border-ink-700 bg-ink-950 md:block">
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
                className="mono-sm text-ash-500 transition-colors hover:text-accent"
              >
                Instagram
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mono-sm text-ash-500 transition-colors hover:text-accent"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950">
        <div className="container-page flex h-16 items-center gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label={settings.site_name}
          >
            <Mark className="h-7 w-7 text-accent-500 transition-colors group-hover:text-accent-300" />
            <span className="display text-[19px] leading-none text-ash-50">
              {settings.site_name}
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            {LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "mono relative py-1 transition-colors",
                    isActive ? "text-accent" : "text-ash-300 hover:text-ash-50",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 h-px w-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-secondary btn-sm !px-3"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className={cn("nums", count > 0 && "text-accent-300")}>{count}</span>
            </button>

            {user ? (
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  className="mono border border-ink-600 px-3 py-2 text-ash-200 transition-colors hover:border-ash-300 hover:text-ash-50"
                >
                  {user.name.split(" ")[0]}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-px w-56 border border-ink-600 bg-ink-850">
                    <div className="border-b border-ink-700 px-3 py-2">
                      <p className="mono-sm text-ash-500">Signed in as</p>
                      <p className="truncate text-sm text-ash-100">{user.name}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-ink-800 hover:text-ash-50"
                    >
                      <Headphones className="h-4 w-4" /> My beats
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-ink-800 hover:text-ash-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ash-300 transition-colors hover:bg-ink-800 hover:text-ash-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-secondary btn-sm">
                  Create account
                </Link>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm !px-2.5 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── mobile menu: plain, stacked, no stagger ────────── */}
        {mobileOpen && (
          <nav className="border-t border-ink-700 bg-ink-950 lg:hidden">
            <div className="container-page grid gap-px py-2">
              {LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "mono py-2.5 transition-colors",
                      isActive ? "text-accent" : "text-ash-300",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex gap-2 border-t border-ink-700 pt-3">
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
                      className="btn btn-primary btn-sm flex-1"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <Ticker
        items={[
          settings.announcement,
          "MP3 · WAV · Trackout",
          "Mobile money · Bank · Card",
          "Licence PDF with every order",
          "Accra → worldwide",
        ]}
      />
    </>
  );
}
