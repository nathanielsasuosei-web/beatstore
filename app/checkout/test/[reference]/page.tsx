import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByReference } from "@/lib/data/sales";
import { simulationAllowed } from "@/lib/paystack";
import { DemoCheckout } from "@/components/demo-checkout";

export const metadata: Metadata = { title: "Test payment" };

export default async function TestCheckoutPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = getOrderByReference(reference);
  if (!order) notFound();

  if (!simulationAllowed()) {
    return (
      <div className="container-page py-16">
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <h1 className="text-xl font-bold">Test payments are disabled</h1>
          <p className="mt-2 text-sm text-ash-400">
            This store has live payment keys configured. Please go back and pay with mobile money or
            card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <DemoCheckout
        reference={order.reference}
        total={order.total}
        currency={order.currency}
        email={order.email}
        items={order.items.map((i) => ({
          title: i.title,
          licenseName: i.licenseName,
          price: i.price,
        }))}
      />
    </div>
  );
}
