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
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center border border-accent-600 bg-accent-600/20 text-accent-300">
              <BarChart3 className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="display text-[15px] text-ash-50">{siteName}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm lg:hidden"
            aria-label="Close"
          >
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
                  "mono relative flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors",
                  isActive(item.href, item.exact)
                    ? "border-accent bg-accent-600/10 text-accent-300"
                    : "border-transparent text-ash-400 hover:border-ink-600 hover:text-ash-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="mono-sm grid h-4 min-w-4 place-items-center bg-accent px-1 text-ash-50">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 border border-ink-700 p-3 text-[11px] leading-relaxed text-ash-400">
          <p className="mono-sm text-ash-300">Integration status</p>
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
            className="mt-2 inline-block text-accent-300 hover:underline"
          >
            Configure →
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-ink-700 p-3">
          <div className="border border-ink-700 p-3">
            <p className="mono-sm truncate text-ash-200">{user.name}</p>
            <p className="mono-sm truncate text-ash-500">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <Link href="/" className="btn btn-secondary btn-sm flex-1">
                <Eye className="h-3.5 w-3.5" /> Store
              </Link>
              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
                aria-label="Sign out"
              >
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
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-700 bg-ink-950 px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-secondary btn-sm lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="mono-sm text-ash-500">Producer admin</p>
            <p className="headline truncate text-sm text-ash-50">
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
