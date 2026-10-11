import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Download,
  Inbox,
  Mail,
  Music2,
  Plus,
  Video,
} from "lucide-react";
import { beatCounts } from "@/lib/data/catalog";
import { listOrders, salesStats } from "@/lib/data/sales";
import { messageCounts, listMessages } from "@/lib/data/inbox";
import { bookingCounts, upcomingBookings } from "@/lib/data/bookings";
import {
  downloadStats,
  genrePerformance,
  paymentMix,
  rangeDelta,
  revenueByTier,
  salesRanges,
  storePulse,
  topBeatsByPlays,
} from "@/lib/data/analytics";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { cssVars, formatDate } from "@/lib/utils";
import { formatBookingDate, formatHour } from "@/lib/schedule";
import { ORDER_STATUS, TIER_META } from "@/lib/constants";
import { BarList, Donut, KpiTile, RevenueChart } from "@/components/admin/charts";
import { PAYMENT_METHODS } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const settings = await getSettings();
  const currency = settings.currency || "GHS";

  const stats = salesStats();
  const counts = beatCounts();
  const messages = messageCounts();
  const bookings = bookingCounts();
  const pulse = storePulse();
  const downloads = downloadStats();
  const ranges = salesRanges();
  const revenue30 = rangeDelta(30);
  const tiers = revenueByTier();
  const mix = paymentMix();
  const genres = genrePerformance(5);
  const crate = topBeatsByPlays(5);
  const upcoming = upcomingBookings(4);
  const { orders: recentOrders } = listOrders({ limit: 6 });
  const awaiting = listOrders({ status: "awaiting_verification", limit: 4 }).orders;
  const inbox = listMessages({ limit: 3 }).messages;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = settings.producer_name.split(" ")[0] || "producer";
  const revenueSeries = ranges["30"].map((point) => point.revenue);
  const orderSeries = ranges["30"].map((point) => point.orders);

  const tierSlices = tiers.map((slice) => ({
    key: slice.tier,
    label: TIER_META[slice.tier as keyof typeof TIER_META]?.label ?? slice.tier,
    value: slice.revenue,
    hint: `${slice.sales} sale${slice.sales === 1 ? "" : "s"} · ${
      TIER_META[slice.tier as keyof typeof TIER_META]?.files ?? ""
    }`,
  }));

  return (
    <div className="space-y-6">
      {/* ══ greeting band ═══════════════════════════════════ */}
      <section className="glass bloom relative overflow-hidden p-5 lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="mono-sm flex items-center gap-2 text-accent">
              <span className="live-dot" aria-hidden />
              Store is live · {pulse.beats.published} beats on the shelf
            </p>
            <h1 className="display mt-3 text-[clamp(1.6rem,3vw,2.4rem)] text-ash-50">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash-400">
              {revenue30.current.orders} paid order{revenue30.current.orders === 1 ? "" : "s"} in the
              last 30 days worth{" "}
              <span className="text-accent-300">
                {formatMoney(revenue30.current.revenue, currency)}
              </span>
              {pulse.orders.awaiting > 0
                ? ` — ${pulse.orders.awaiting} payment${
                    pulse.orders.awaiting === 1 ? "" : "s"
                  } still to verify.`
                : " — nothing is waiting on you right now."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/beats/new" className="btn btn-primary btn-sm sheen">
              <Plus className="h-3.5 w-3.5" /> New beat
            </Link>
            <Link
              href="/admin/orders?status=awaiting_verification"
              className="btn btn-secondary btn-sm"
            >
              <Banknote className="h-3.5 w-3.5" /> Verify payments
              {pulse.orders.awaiting > 0 && (
                <span className="mono-sm ml-1 bg-accent px-1.5 text-[color:var(--accent-on)]">
                  {pulse.orders.awaiting}
                </span>
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ KPI tiles ═══════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Revenue · 30 days"
          value={revenue30.current.revenue}
          money
          currency={currency}
          delta={revenue30.percent}
          hint={`${formatMoney(stats.revenue, currency)} all time`}
          series={revenueSeries}
          icon={<Banknote className="h-4 w-4" />}
          href="/admin/orders"
          delay={40}
        />
        <KpiTile
          label="Orders · 30 days"
          value={revenue30.current.orders}
          delta={revenue30.percent}
          hint={`${formatMoney(revenue30.current.average, currency)} average order`}
          series={orderSeries}
          icon={<ArrowUpRight className="h-4 w-4" />}
          href="/admin/orders"
          delay={120}
        />
        <KpiTile
          label="Preview plays"
          value={pulse.beats.plays}
          hint={`${counts.published} published · ${counts.total} total`}
          icon={<Music2 className="h-4 w-4" />}
          href="/admin/beats"
          delay={200}
        />
        <KpiTile
          label="Artists"
          value={pulse.artists.total}
          hint={`${pulse.artists.newThisWeek} joined this week`}
          icon={<Inbox className="h-4 w-4" />}
          href="/admin/users"
          delay={280}
        />
      </section>

      {/* ══ revenue + payment mix ═══════════════════════════ */}
      <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <RevenueChart series={ranges} currency={currency} initialRange="30" />
        <Donut
          label="How buyers paid"
          currency={currency}
          delay={160}
          slices={mix.map((slice, index) => ({
            label:
              PAYMENT_METHODS[slice.method as keyof typeof PAYMENT_METHODS]?.label ?? slice.method,
            value: slice.total,
            accent: index === 0,
          }))}
        />
      </section>

      {/* ══ money to verify + what's next ═══════════════════ */}
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass rise p-5" style={cssVars({ "--d": "80ms" })}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="mono-sm flex items-center gap-2 text-amber-200">
              <Banknote className="h-3.5 w-3.5" />
              {pulse.orders.awaiting} payment{pulse.orders.awaiting === 1 ? "" : "s"} to verify
            </p>
            <Link
              href="/admin/orders?status=awaiting_verification"
              className="mono-sm text-accent-300 hover:underline"
            >
              All orders →
            </Link>
          </div>

          <ul className="stagger mt-4 divide-y divide-ink-800/80">
            {awaiting.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="headline truncate text-sm text-ash-100">
                    {order.reference} · {order.name}
                  </p>
                  <p className="mono-sm truncate text-amber-200/70">
                    {(PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS]?.short ??
                      order.paymentMethod)}{" "}
                    · {order.payerNote ?? "no reference given"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="headline nums text-amber-200">
                    {formatMoney(order.total, order.currency)}
                  </span>
                  <Link href={`/admin/orders?q=${order.reference}`} className="btn btn-secondary btn-sm">
                    Open
                  </Link>
                </div>
              </li>
            ))}
            {awaiting.length === 0 && (
              <li className="py-6 text-sm text-ash-500">
                Nothing waiting. Every payment has been verified.
              </li>
            )}
          </ul>

          {upcoming.length > 0 && (
            <div className="mt-5 border-t border-ink-700 pt-4">
              <div className="flex items-center justify-between">
                <p className="mono-sm flex items-center gap-2 text-ash-500">
                  <CalendarClock className="h-3.5 w-3.5" /> Next sessions
                </p>
                <Link href="/admin/bookings" className="mono-sm text-accent-300 hover:underline">
                  Bookings →
                </Link>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {upcoming.map((booking) => (
                  <li
                    key={booking.id}
                    className="border border-ink-700/80 bg-ink-900/50 px-3 py-2.5"
                    style={{ borderRadius: "var(--radius-ui)" }}
                  >
                    <p className="text-sm text-ash-100">{booking.serviceName}</p>
                    <p className="mono-sm mt-1 text-ash-500">
                      {formatBookingDate(booking.date)} · {formatHour(booking.startHour)}–
                      {formatHour(booking.endHour)} · {booking.name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <BarList
            label="Licence mix"
            currency={currency}
            delay={140}
            action={{ href: "/admin/settings", label: "Pricing" }}
            items={tierSlices}
          />

          <div className="glass rise p-5" style={cssVars({ "--d": "200ms" })}>
            <p className="mono-sm text-ash-500">Delivery health</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-ash-300">Emails sent</span>
                <span className="nums text-ash-100">{pulse.emails.sent}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-ash-300">Queued / outbox</span>
                <span className="nums text-ash-100">{pulse.emails.queued}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-ash-300">Download links issued</span>
                <span className="nums text-ash-100">{downloads.total}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-ash-300">Files pulled this week</span>
                <span className="nums text-ash-100">{downloads.activeThisWeek}</span>
              </li>
              {downloads.expiringSoon > 0 && (
                <li className="flex items-center justify-between gap-3">
                  <span className="text-amber-200">Links expiring in 3 days</span>
                  <span className="nums text-amber-200">{downloads.expiringSoon}</span>
                </li>
              )}
            </ul>
            <Link
              href="/admin/outbox"
              className="mono-sm mt-4 inline-flex items-center gap-1.5 text-accent-300 hover:underline"
            >
              <Mail className="h-3 w-3" /> Read the outbox
            </Link>
          </div>
        </div>
      </section>

      {/* ══ recent orders ═══════════════════════════════════ */}
      <section className="glass rise p-5" style={cssVars({ "--d": "80ms" })}>
        <div className="flex items-center justify-between gap-3">
          <p className="mono-sm text-ash-500">Recent orders</p>
          <Link href="/admin/orders" className="mono-sm text-accent-300 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="table-clean min-w-[620px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Beats</th>
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
                    <td className="max-w-[16rem] truncate text-xs text-ash-400">
                      {order.items.map((item) => item.title).join(", ") || "—"}
                    </td>
                    <td className="headline nums text-sm">
                      {formatMoney(order.total, order.currency)}
                    </td>
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
                    <td className="nums text-xs text-ash-500">{formatDate(order.createdAt)}</td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-ash-500">
                    No orders yet — share a beat link to get the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══ crate + genres + inbox ══════════════════════════ */}
      <section className="grid gap-4 lg:grid-cols-3">
        <BarList
          label="Top of the crate · plays"
          delay={80}
          action={{ href: "/admin/beats", label: "Beats" }}
          items={crate.map((beat) => ({
            key: beat.slug ?? beat.title,
            label: beat.title,
            value: beat.plays,
            hint: beat.genre ?? undefined,
            href: beat.slug ? `/beats/${beat.slug}` : undefined,
          }))}
        />
        <BarList
          label="Genres by plays"
          delay={160}
          items={genres.map((row) => ({
            key: row.genre,
            label: row.genre,
            value: row.plays,
            hint: `${row.beats} beat${row.beats === 1 ? "" : "s"} · ${row.sales} sold`,
          }))}
        />

        <div className="glass rise flex flex-col p-5" style={cssVars({ "--d": "240ms" })}>
          <div className="flex items-center justify-between gap-3">
            <p className="mono-sm flex items-center gap-2 text-ash-500">
              <Inbox className="h-3.5 w-3.5" /> Inbox
              {messages.new > 0 && (
                <span className="bg-accent px-1.5 text-[color:var(--accent-on)]">
                  {messages.new} new
                </span>
              )}
            </p>
            <Link href="/admin/messages" className="mono-sm text-accent-300 hover:underline">
              Open →
            </Link>
          </div>

          <ul className="stagger mt-4 flex-1 space-y-3">
            {inbox.map((message) => (
              <li key={message.id} className="border-b border-ink-800/80 pb-3 last:border-0">
                <p className="truncate text-sm text-ash-100">{message.subject}</p>
                <p className="mono-sm mt-1 truncate text-ash-500">
                  {message.name} · {formatDate(message.createdAt)}
                </p>
              </li>
            ))}
            {inbox.length === 0 && (
              <li className="text-sm text-ash-600">No messages yet — artists can write from the contact page.</li>
            )}
          </ul>

          <div className="mt-5 grid gap-2 border-t border-ink-700 pt-4">
            {[
              { href: "/admin/beats/new", label: "Upload a beat", icon: Music2 },
              { href: "/admin/videos", label: "Add a video", icon: Video },
              { href: "/admin/outbox", label: "Preview sent emails", icon: Download },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="hover-lift flex items-center gap-3 border border-ink-700/80 bg-ink-900/40 px-3.5 py-2.5 text-sm text-ash-300 transition-colors hover:border-accent/40 hover:text-ash-50"
                style={{ borderRadius: "var(--radius-ui)" }}
              >
                <action.icon className="h-4 w-4 text-accent-400" />
                {action.label}
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-ash-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ the quieter numbers ═════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Orders all time", value: pulse.orders.total, hint: `${pulse.orders.failed} failed` },
          { label: "Messages received", value: pulse.messages.total, hint: `${pulse.messages.unread} unread` },
          {
            label: "Downloads used",
            value: downloads.downloadsUsed,
            hint: `${downloads.total} live links`,
          },
          {
            label: "Sessions booked",
            value: bookings.confirmed + bookings.todo,
            hint: `${bookings.todo} deposit${bookings.todo === 1 ? "" : "s"} to verify`,
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className="glass rise p-4"
            style={{ ["--d" as string]: `${index * 70}ms` } as React.CSSProperties}
          >
            <p className="mono-sm text-ash-500">{item.label}</p>
            <p className="headline nums mt-2 text-xl text-ash-50">{item.value}</p>
            <p className="mono-sm mt-1 text-ash-600">{item.hint}</p>
          </div>
        ))}
      </section>

      {/* ══ licence pricing reference ═══════════════════════ */}
      <section className="glass rise p-5" style={cssVars({ "--d": "120ms" })}>
        <p className="mono-sm text-ash-500">Licence pricing at a glance</p>
        <p className="mt-1 text-xs text-ash-500">
          Defaults used when you upload a new beat — override them per beat in the uploader.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(TIER_META).map(([tier, meta]) => (
            <div
              key={tier}
              className="border border-ink-700/80 bg-ink-900/40 p-4"
              style={{ borderRadius: "var(--radius-ui)" }}
            >
              <p className="mono-sm text-ash-500">{meta.label}</p>
              <p className="headline nums mt-1 text-lg text-accent-300">
                {formatMoney(meta.defaultPrice, currency)}
              </p>
              <p className="mt-1 text-xs text-ash-500">{meta.files}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
