import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CalendarClock, Clock, Download, FileText, ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { downloadsForOrder, ordersForUser } from "@/lib/data/sales";
import { getUserById } from "@/lib/data/users";
import { messagesForUser } from "@/lib/data/inbox";
import { listBookings } from "@/lib/data/bookings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatBookingDate, formatHour } from "@/lib/schedule";
import { BOOKING_STATUS, ORDER_STATUS } from "@/lib/constants";
import { ProfileForm } from "@/components/profile-form";
import { ContactForm } from "@/components/contact-form";
import { Stat } from "@/components/section";

export const metadata: Metadata = { title: "My dashboard" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; verified?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const params = await searchParams;
  const [settings, profile] = await Promise.all([
    getSettings(),
    Promise.resolve(getUserById(user.id)),
  ]);
  const orders = ordersForUser(user);
  const downloadsByOrder = new Map(orders.map((order) => [order.id, downloadsForOrder(order.id)]));
  const messages = messagesForUser(user);
  const bookings = listBookings({ email: user.email, limit: 20 });
  const paidOrders = orders.filter((o) => o.status === "paid");
  const spent = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDownloads = paidOrders.length;

  return (
    <div className="container-page py-12">
      {params.welcome && (
        <div className="mb-6 flex items-start gap-3 border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-sm text-accent-200">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Welcome{profile?.stageName ? `, ${profile.stageName}` : ""}! Your account is ready.
            Confirmation email sent to {user.email} — click the link inside to verify it.
          </p>
        </div>
      )}
      {params.verified === "1" && (
        <div className="mb-6 border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-sm text-accent-200">
          Email verified — you&apos;re all set.
        </div>
      )}
      {params.verified && params.verified !== "1" && (
        <div className="mb-6 border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-200">
          That verification link didn&apos;t match an account. You can request a new one from your
          profile.
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-sm text-accent">Artist dashboard</p>
          <h1 className="mt-1 display text-3xl text-ash-50">{profile?.stageName || user.name}</h1>
          <p className="mono-sm mt-2 text-ash-400">
            {user.email}
            {profile?.emailVerified ? (
              <span className="ml-2 chip chip-accent">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="ml-2 chip">Email not verified</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/beats" className="btn btn-primary btn-sm">
            Browse beats
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-secondary btn-sm">
              Admin dashboard
            </Link>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(orders.length)} hint={`${paidOrders.length} paid`} />
        <Stat label="Beats owned" value={String(totalDownloads)} hint="Available to download" />
        <Stat label="Total spent" value={formatMoney(spent)} hint="Across all orders" />
        <Stat label="Messages" value={String(messages.length)} hint="In the studio inbox" />
      </div>

      <section className="mt-10">
        <div className="section-head">
          <h2 className="headline text-lg text-ash-50">Your beats &amp; licences</h2>
        </div>
        <p className="mt-1 text-sm text-ash-400">
          Download links stay live for 30 days after purchase. Need them re-issued? Reply to any
          delivery email.
        </p>

        {orders.length === 0 ? (
          <div className="surface-card mt-4 grid place-items-center gap-2 p-12 text-center">
            <ShoppingBag className="h-8 w-8 text-ash-600" />
            <p className="text-sm text-ash-400">Nothing bought yet — your first beat is waiting.</p>
            <Link href="/beats" className="btn btn-primary btn-sm mt-1">
              Browse the store
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
              return (
                <div key={order.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.reference}</p>
                      <p className="text-xs text-ash-500">
                        {formatDate(order.createdAt, true)} ·{" "}
                        {order.paymentMethod.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                      <span className="font-bold text-accent-300">
                        {formatMoney(order.total, order.currency)}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {order.items.map((item) => {
                      const itemDownload =
                        downloadsByOrder.get(order.id)?.find((d) => d.orderItemId === item.id) ??
                        null;
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 border border-ink-700 bg-ink-850 px-3.5 py-2.5"
                        >
                          <span className="text-sm">
                            {item.title}
                            <span className="text-ash-500"> · {item.licenseName}</span>
                          </span>
                          {order.status === "paid" ? (
                            <span className="flex gap-2">
                              {itemDownload ? (
                                <>
                                  <a
                                    href={`/api/download/${itemDownload.token}?download=1`}
                                    className="btn btn-primary btn-sm"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </a>
                                  <a
                                    href={`/api/download/${itemDownload.token}/license?download=1`}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <FileText className="h-3.5 w-3.5" /> Licence
                                  </a>
                                </>
                              ) : (
                                <Link
                                  href={`/checkout/success/${order.reference}`}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Open order
                                </Link>
                              )}
                            </span>
                          ) : (
                            <Link
                              href={`/checkout/pay/${order.reference}`}
                              className="btn btn-secondary btn-sm"
                            >
                              <Clock className="h-3.5 w-3.5" /> Complete payment
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="section-head">
            <h2 className="headline text-lg text-ash-50">Studio sessions</h2>
          </div>
          <Link href="/studio" className="btn btn-secondary btn-sm">
            Book studio time
          </Link>
        </div>
        <p className="mt-1 text-sm text-ash-400">
          Recording, mixing and mastering slots you&apos;ve reserved — deposits are 50%, the balance
          is settled at the studio.
        </p>

        {bookings.length === 0 ? (
          <div className="surface-card mt-4 grid place-items-center gap-2 p-8 text-center">
            <CalendarClock className="h-7 w-7 text-ash-600" />
            <p className="text-sm text-ash-400">No sessions booked yet — the booth is waiting.</p>
            <Link href="/studio" className="btn btn-primary btn-sm mt-1">
              Pick a slot
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => {
              const status = BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
              const paid = booking.status === "confirmed" || booking.status === "completed";
              return (
                <div
                  key={booking.id}
                  className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {booking.serviceName} · {formatBookingDate(booking.date)}
                    </p>
                    <p className="text-xs text-ash-500">
                      {formatHour(booking.startHour)} – {formatHour(booking.endHour)} ·{" "}
                      {booking.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        paid
                          ? "bg-accent-400/15 text-accent-300"
                          : booking.status === "cancelled"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {status?.label ?? booking.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-300">
                        {formatMoney(booking.amountDue, booking.currency)}
                      </p>
                      <p className="text-[11px] text-ash-500">
                        balance {formatMoney(booking.balanceAmount, booking.currency)} at studio
                      </p>
                    </div>
                    {!paid && booking.status !== "cancelled" && (
                      <Link
                        href={`/studio/pay/${booking.reference}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Clock className="h-3.5 w-3.5" /> Pay deposit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="section-head">
            <h2 className="headline text-lg text-ash-50">Your details</h2>
          </div>
          <p className="mt-1 text-sm text-ash-400">
            The name here is printed on your licence agreements — keep it as you want it to appear.
          </p>
          <div className="mt-4">
            <ProfileForm
              defaults={{
                name: profile?.name ?? "",
                stageName: profile?.stageName ?? "",
                phone: profile?.phone ?? "",
                country: profile?.country ?? "",
              }}
            />
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2 className="headline text-lg text-ash-50">Message the producer</h2>
          </div>
          <p className="mt-1 text-sm text-ash-400">
            Custom beats, mixing, stems or order problems — it comes straight to the studio inbox.
          </p>
          <div className="mt-4">
            <ContactForm
              compact
              defaultName={profile?.name ?? ""}
              defaultEmail={user.email}
              topics={[
                { id: "support", label: "Order help" },
                { id: "custom-beat", label: "Custom beat" },
                { id: "licence", label: "Licence question" },
                { id: "collab", label: "Collaboration / sync" },
                { id: "general", label: "Something else" },
              ]}
            />
          </div>
        </div>
      </section>

      {messages.length > 0 && (
        <section className="mt-12">
          <div className="section-head">
            <h2 className="headline text-lg text-ash-50">Your messages</h2>
          </div>
          <div className="mt-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="surface-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="headline text-sm text-ash-100">
                    {message.direction === "outbound" ? "Reply from the studio" : message.subject}
                  </p>
                  <span className="text-xs text-ash-500">
                    {formatDate(message.createdAt, true)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-ash-400">{message.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-xs text-ash-500">
        Need a hand? Email {settings.support_email} or reply to any message from the studio.
      </p>
    </div>
  );
}
