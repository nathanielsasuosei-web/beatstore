import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingByReference } from "@/lib/data/bookings";
import { simulationAllowed } from "@/lib/paystack";
import { DemoCheckout } from "@/components/demo-checkout";

export const metadata: Metadata = { title: "Test deposit payment" };

export default async function TestBookingCheckoutPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = getBookingByReference(reference);
  if (!booking) notFound();

  if (!simulationAllowed()) {
    return (
      <div className="container-page py-16">
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <h1 className="text-xl font-bold">Test payments are disabled</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This store has live payment keys configured. Please go back and pay your deposit with mobile money or
            card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <DemoCheckout
        reference={booking.reference}
        total={booking.amountDue}
        currency={booking.currency}
        email={booking.email}
        items={[
          {
            title: `${booking.serviceName} session — ${booking.date} ${String(booking.startHour).padStart(2, "0")}:00`,
            licenseName: `Deposit (${booking.depositPercent}%) + service fee`,
            price: booking.amountDue,
          },
        ]}
        doneHref={`/studio/confirmed/${booking.reference}`}
        kind="Booking"
      />
    </div>
  );
}
