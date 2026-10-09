"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingBag, X, LogOut, LayoutDashboard, User, Headphones } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

type Props = {
  settings: Record<string, string>;
  user: { name: string; role: string } | null;
};

export function SiteHeader({ settings, user }: Props) {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/beats", label: "Beats" },
    { href: "/videos", label: "Videos" },
    { href: "/studio", label: "Studio" },
    { href: "/licensing", label: "Licensing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  // The storefront chrome stays out of the way on admin + checkout screens.
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/70 bg-ink-900/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-ink-950">
            <Headphones className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <span className="font-bold tracking-tight text-[15px]">{settings.site_name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "text-white bg-ink-800"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative btn btn-secondary btn-sm"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[11px] font-bold text-ink-950">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="btn btn-secondary btn-sm"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-24 truncate">{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 p-1.5 shadow-2xl">
                    <div className="px-3 py-2 text-xs text-zinc-500">
                      Signed in as
                      <div className="truncate text-sm text-zinc-200">{user.name}</div>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-ink-800 hover:text-white"
                    >
                      <Headphones className="h-4 w-4" /> My beats
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-ink-800 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-ink-800 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
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
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-ink-700 bg-ink-850 px-4 py-3">
          <nav className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-ink-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn btn-secondary btn-sm">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-sm">
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
