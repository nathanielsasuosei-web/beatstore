"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  Settings,
  ShoppingCart,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/beats", label: "Beats", icon: Music2 },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badgeKey: "orders" as const },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock, badgeKey: "bookings" as const },
  { href: "/admin/messages", label: "Messages", icon: Inbox, badgeKey: "messages" as const },
  { href: "/admin/users", label: "Artists", icon: Users },
  { href: "/admin/outbox", label: "Email outbox", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-ink-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-ink-800 bg-ink-900 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lime-300 to-emerald-500 text-ink-950">
              <BarChart3 className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <span className="text-sm font-bold">{siteName}</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm lg:hidden" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  isActive(item.href, item.exact)
                    ? "bg-lime-400/10 text-lime-200 ring-1 ring-lime-400/20"
                    : "text-zinc-400 hover:bg-ink-850 hover:text-zinc-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[11px] font-bold text-ink-950">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 rounded-2xl border border-ink-800 bg-ink-850/60 p-3 text-[11px] leading-relaxed text-zinc-400">
          <p className="font-semibold text-zinc-300">Integration status</p>
          <p className="mt-2 flex items-center justify-between">
            Paystack
            <span className={status.paystack ? "text-lime-300" : "text-amber-300"}>
              {status.paystack ? "live keys" : "test mode"}
            </span>
          </p>
          <p className="mt-1 flex items-center justify-between">
            Email
            <span className={status.email === "resend" ? "text-lime-300" : "text-amber-300"}>
              {status.email === "resend" ? "Resend" : "outbox only"}
            </span>
          </p>
          <Link href="/admin/settings" className="mt-2 inline-block text-lime-300 hover:underline">
            Configure →
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-ink-800 p-3">
          <div className="rounded-xl bg-ink-850 p-3">
            <p className="truncate text-xs font-semibold text-zinc-200">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <Link href="/" className="btn btn-secondary btn-sm flex-1">
                <Eye className="h-3.5 w-3.5" /> Store
              </Link>
              <button type="button" onClick={logout} className="btn btn-secondary btn-sm" aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-800 bg-ink-950/90 px-4 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-sm lg:hidden" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Producer admin</p>
            <p className="truncate text-sm font-semibold">
              {NAV.find((item) => isActive(item.href, item.exact))?.label ?? "Dashboard"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/beats/new" className="btn btn-primary btn-sm">
              <Music2 className="h-3.5 w-3.5" /> Upload beat
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
