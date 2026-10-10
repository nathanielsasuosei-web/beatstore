import { getSettings } from "@/lib/settings";
import { bookingCounts, listBookings, listServices } from "@/lib/data/bookings";
import { BookingsTable } from "@/components/admin/bookings-table";
import { ServicesManager } from "@/components/admin/services-manager";
import { Stat } from "@/components/section";
import { formatMoney } from "@/lib/money";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const [settings] = await Promise.all([getSettings()]);
  const bookings = listBookings({ status, limit: 200 });
  const services = listServices();
  const counts = bookingCounts();
  const currency = settings.currency || "GHS";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl text-ash-50">Studio bookings</h1>
        <p className="mt-1 text-sm text-ash-400">
          {counts.total} booking{counts.total === 1 ? "" : "s"} total. Confirming a deposit emails
          the artist their session confirmation instantly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="To verify" value={String(counts.todo)} hint="Manual MoMo / bank deposits" />
        <Stat label="Confirmed" value={String(counts.confirmed)} hint="Upcoming paid sessions" />
        <Stat label="Completed" value={String(counts.completed)} hint="Sessions finished" />
        <Stat
          label="Deposits collected"
          value={formatMoney(counts.deposits, currency)}
          hint="Confirmed + completed"
        />
      </div>

      <BookingsTable
        currentFilter={status}
        bookings={bookings.map((booking) => ({
          id: booking.id,
          reference: booking.reference,
          serviceName: booking.serviceName,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          date: booking.date,
          startHour: booking.startHour,
          endHour: booking.endHour,
          hours: booking.hours,
          sessionTotal: booking.sessionTotal,
          depositAmount: booking.depositAmount,
          serviceFeeAmount: booking.serviceFeeAmount,
          amountDue: booking.amountDue,
          balanceAmount: booking.balanceAmount,
          currency: booking.currency,
          notes: booking.notes,
          status: booking.status,
          paymentMethod: booking.paymentMethod,
          payerNote: booking.payerNote,
          paidAt: booking.paidAt ? booking.paidAt.toISOString() : null,
          createdAt: booking.createdAt.toISOString(),
        }))}
      />

      <section>
        <h2 className="text-lg font-bold tracking-tight">Services bookable on /studio</h2>
        <p className="mt-1 text-sm text-ash-400">
          Prices, session lengths and descriptions for the public booking page. Opening hours,
          deposit % and the service fee live in{" "}
          <a href="/admin/settings" className="link-accent">
            Settings
          </a>
          .
        </p>
        <div className="mt-4">
          <ServicesManager
            currency={currency}
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              pricePerHour: service.pricePerHour,
              minHours: service.minHours,
              maxHours: service.maxHours,
              active: service.active,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
