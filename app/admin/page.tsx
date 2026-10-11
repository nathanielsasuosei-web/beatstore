import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Banknote, Clock, Download, Mail, Music2, Plus, Video } from "lucide-react";
import { beatCounts } from "@/lib/data/catalog";
import { listOrders, salesStats } from "@/lib/data/sales";
import { messageCounts } from "@/lib/data/inbox";
import { bookingCounts, upcomingBookings } from "@/lib/data/bookings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatBookingDate, formatHour } from "@/lib/schedule";
import { ORDER_STATUS, TIER_META } from "@/lib/constants";
import { Stat } from "@/components/section";

export default function AdminDashboard() {
  const stats = salesStats();
  const beats = beatCounts();
  const messages = messageCounts();
  const bookings = bookingCounts();
  const upcoming = upcomingBookings(5);
  const { orders: recentOrders } = listOrders({ limit: 5 });
  const awaiting = listOrders({ status: "awaiting_verification", limit: 5 }).orders;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-2xl text-ash-50">Studio overview</h1>
          <p className="mt-1 text-sm text-ash-400">
            Everything happening on the store right now — sales, bookings, payments to verify and
            messages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/beats/new" className="btn btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" /> New beat
          </Link>
          <Link
            href="/admin/orders?status=awaiting_verification"
            className="btn btn-secondary btn-sm"
          >
            <Clock className="h-3.5 w-3.5" /> Verify payments ({stats.awaitingOrders})
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue (all time)"
          value={formatMoney(stats.revenue)}
          hint={`${formatMoney(stats.weekRevenue)} in the last 7 days`}
        />
        <Stat
          label="Paid orders"
          value={String(stats.paidOrders)}
          hint={`${stats.weekOrders} in the last 7 days`}
        />
        <Stat
          label="Beats online"
          value={String(beats.published)}
          hint={`${beats.total} total · ${beats.plays.toLocaleString()} plays`}
        />
        <Stat
          label="Studio bookings"
          value={String(bookings.confirmed + bookings.todo)}
          hint={`${bookings.todo} deposit${bookings.todo === 1 ? "" : "s"} to verify`}
        />
      </div>

      {upcoming.length > 0 && (
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="headline text-sm text-ash-50">Next studio sessions</h2>
            <Link href="/admin/bookings" className="text-xs text-accent-300 hover:underline">
              All bookings →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-800">
            {upcoming.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="headline text-sm text-ash-100">
                    {booking.serviceName} · {formatBookingDate(booking.date)} ·{" "}
                    {formatHour(booking.startHour)}–{formatHour(booking.endHour)}
                  </p>
                  <p className="text-xs text-ash-500">
                    {booking.name} · {booking.email}
                    {booking.status === "confirmed"
                      ? ` · deposit paid ${formatMoney(booking.amountDue, booking.currency)}`
                      : ` · awaiting ${formatMoney(booking.amountDue, booking.currency)} deposit`}
                  </p>
                </div>
                <span
                  className={`badge ${
                    booking.status === "confirmed"
                      ? "bg-accent-400/15 text-accent-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {booking.status === "confirmed"
                    ? "Confirmed"
                    : booking.status === "pending"
                      ? "Unpaid"
                      : "Verifying"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {awaiting.length > 0 && (
        <section className=" border border-amber-900/50 bg-amber-950/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-amber-200">
              <Banknote className="h-4 w-4" /> {awaiting.length} payment
              {awaiting.length === 1 ? "" : "s"} waiting to be verified
            </h2>
            <Link
              href="/admin/orders?status=awaiting_verification"
              className="btn btn-secondary btn-sm"
            >
              Review now
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-amber-900/30">
            {awaiting.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="headline text-sm text-ash-100">
                    {order.reference} · {order.name}
                  </p>
                  <p className="text-xs text-amber-200/70">
                    {order.paymentMethod.replace("_", " ")} ·{" "}
                    {order.payerNote ?? "no reference given"}
                  </p>
                </div>
                <span className="headline nums text-amber-200">
                  {formatMoney(order.total, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="headline text-sm text-ash-50">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-accent-300 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="table-clean min-w-[560px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-xs text-accent-300">{order.reference}</td>
                      <td>
                        <div className="text-sm">{order.name}</div>
                        <div className="text-xs text-ash-500">{order.email}</div>
                      </td>
                      <td className="font-semibold">{formatMoney(order.total, order.currency)}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === "paid"
                              ? "bg-accent-400/15 text-accent-300"
                              : order.status === "awaiting_verification"
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-ink-700 text-ash-400"
                          }`}
                        >
                          {status?.label ?? order.status}
                        </span>
                      </td>
                      <td className="text-xs text-ash-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-ash-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Best sellers</h2>
            <ul className="mt-4 space-y-3">
              {stats.topBeats.length === 0 && (
                <li className="text-sm text-ash-500">No sales yet.</li>
              )}
              {stats.topBeats.map((beat) => (
                <li key={`${beat.slug}-${beat.title}`} className="flex items-center gap-3">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden bg-ink-800">
                    {beat.coverImage ? (
                      <Image
                        src={beat.coverImage}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{beat.title}</span>
                    <span className="block text-xs text-ash-500">
                      {beat.sales} sale{beat.sales === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-accent-300">
                    {formatMoney(beat.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              {[
                { href: "/admin/beats/new", label: "Upload a beat", icon: Music2 },
                { href: "/admin/videos", label: "Add a video", icon: Video },
                { href: "/admin/messages", label: `Answer messages (${messages.new})`, icon: Mail },
                { href: "/admin/outbox", label: "Preview sent emails", icon: Download },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-ash-300 transition hover:border-ink-600 hover:text-ash-50"
                >
                  <action.icon className="h-4 w-4 text-accent-400" />
                  {action.label}
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-ash-500" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h2 className="headline text-sm text-ash-50">Licence pricing at a glance</h2>
        <p className="mt-1 text-xs text-ash-500">
          Defaults used when you upload a new beat — override them per beat in the uploader.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(TIER_META).map(([tier, meta]) => (
            <div key={tier} className=" border border-ink-700 bg-ink-850 p-4">
              <p className="mono-sm text-ash-500">{meta.label}</p>
              <p className="headline nums mt-1 text-lg text-accent-300">
                {formatMoney(meta.defaultPrice)}
              </p>
              <p className="mt-1 text-xs text-ash-500">{meta.files}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
