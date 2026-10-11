"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  Eye,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Music2,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn, cssVars } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/beats", label: "Beats", icon: Music2 },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badgeKey: "orders" as const },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarClock,
    badgeKey: "bookings" as const,
  },
  { href: "/admin/messages", label: "Messages", icon: Inbox, badgeKey: "messages" as const },
  { href: "/admin/users", label: "Artists", icon: Users },
  { href: "/admin/outbox", label: "Email outbox", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

/** The clock in the header — proves the dashboard is looking at live data. */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 1000);
    // first tick on the next frame — the interval would leave a blank second
    const frame = window.requestAnimationFrame(tick);
    return () => {
      window.clearInterval(timer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <p className="mono-sm nums hidden text-ash-500 md:block" suppressHydrationWarning>
      {now
        ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "--:--:--"}{" "}
      GMT
    </p>
  );
}

export function AdminShell({
  user,
  siteName,
  badges,
  status,
  children,
}: {
  user: { name: string; email: string };
  siteName: string;
  badges: { messages: number; orders: number; bookings: number };
  status: { paystack: boolean; email: "resend" | "outbox" };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const activeHref = NAV.find((item) => isActive(item.href, item.exact))?.href ?? null;
  const current = NAV.find((item) => item.href === activeHref);

  // One rail element glides between nav items instead of a border on each.
  // Written straight to the DOM: it is decoration, not state.
  useEffect(() => {
    const link = activeHref ? itemRefs.current[activeHref] : null;
    const nav = navRef.current;
    const rail = railRef.current;
    if (!link || !nav || !rail) return;
    const linkBox = link.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    rail.style.transform = `translateY(${linkBox.top - navBox.top}px)`;
    rail.style.height = `${linkBox.height}px`;
    rail.style.opacity = "1";
  }, [activeHref, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* ══ sidebar ═════════════════════════════════════════ */}
      <aside
        className={cn(
          "glass fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-ink-800/70 transition-transform duration-500 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionTimingFunction: "var(--ease-out-quint)" }}
      >
        <div className="bloom relative flex h-16 shrink-0 items-center justify-between border-b border-ink-800/70 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center border border-accent-600 bg-accent-600/20 text-accent-300"
              style={{ borderRadius: "var(--radius-ui)" }}
            >
              <BarChart3 className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="display text-[15px] text-ash-50">{siteName}</span>
            <span className="mono-sm text-accent">v12</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav ref={navRef} className="stagger relative flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {/* the sliding rail */}
          <span
            ref={railRef}
            className="nav-rail"
            aria-hidden
            style={{ height: 0, opacity: 0 }}
          />
          {NAV.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(node) => {
                  itemRefs.current[item.href] = node;
                }}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mono group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-300",
                  active
                    ? "bg-accent-600/10 text-accent-300"
                    : "text-ash-400 hover:translate-x-0.5 hover:bg-ink-800/50 hover:text-ash-100",
                )}
                style={{ borderRadius: "var(--radius-ui)" }}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    !active && "group-hover:scale-110",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    key={badge}
                    className="mono-sm pop-in grid h-4 min-w-4 place-items-center bg-accent px-1 text-[color:var(--accent-on)]"
                    style={{ borderRadius: 2 }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-3 p-3">
          <div
            className="border border-ink-700/80 bg-ink-900/50 p-3 text-[11px] leading-relaxed text-ash-400"
            style={{ borderRadius: "var(--radius-ui)" }}
          >
            <p className="mono-sm flex items-center gap-2 text-ash-300">
              <span
                className={cn("live-dot", status.paystack && status.email === "resend" && "")}
                aria-hidden
              />
              Integration status
            </p>
            <p className="mt-2 flex items-center justify-between">
              Paystack
              <span className={status.paystack ? "text-accent-300" : "text-amber-300"}>
                {status.paystack ? "live keys" : "test mode"}
              </span>
            </p>
            <p className="mt-1 flex items-center justify-between">
              Email
              <span className={status.email === "resend" ? "text-accent-300" : "text-amber-300"}>
                {status.email === "resend" ? "Resend" : "outbox only"}
              </span>
            </p>
            <Link
              href="/admin/settings"
              className="mono-sm mt-2 inline-block text-accent-300 hover:underline"
            >
              Configure →
            </Link>
          </div>

          <div
            className="flex items-center gap-3 border border-ink-700/80 bg-ink-900/50 p-3"
            style={{ borderRadius: "var(--radius-ui)" }}
          >
            <span
              className="display grid h-9 w-9 shrink-0 place-items-center bg-accent text-[13px] text-[color:var(--accent-on)]"
              style={{ borderRadius: "var(--radius-ui)" }}
            >
              {initials || "NS"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ash-100">{user.name}</p>
              <p className="mono-sm truncate text-ash-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-ash-500 transition-colors hover:text-accent-300"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <Link href="/" className="btn btn-secondary btn-sm w-full">
            <Eye className="h-3.5 w-3.5" /> View store
          </Link>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="overlay-in fixed inset-0 z-30 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ══ content ═════════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass glass-hairline sticky top-0 z-20 flex h-16 items-center gap-3 px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary btn-sm lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* keyed on the route so the title animates on every navigation */}
          <div key={pathname} className="slide-left min-w-0" style={cssVars({ "--d": "0ms" })}>
            <p className="mono-sm text-ash-500">Producer admin</p>
            <p className="headline truncate text-sm text-ash-50">
              {current?.label ?? "Dashboard"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LiveClock />
            <span className="hidden h-6 w-px bg-ink-700 md:block" aria-hidden />
            <Link href="/admin/beats/new" className="btn btn-primary btn-sm sheen">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload beat</span>
              <span className="sm:hidden">Beat</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
