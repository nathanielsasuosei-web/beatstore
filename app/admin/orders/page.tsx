import { listOrders, salesStats } from "@/lib/data/sales";
import { OrdersTable } from "@/components/admin/orders-table";
import { Stat } from "@/components/section";
import { formatMoney } from "@/lib/money";
import { paystackEnabled } from "@/lib/paystack";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const { orders, total } = listOrders({ status, limit: 100 });
  const stats = salesStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {total} order{total === 1 ? "" : "s"} shown. Marking an order paid issues download links and emails
          the buyer automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue" value={formatMoney(stats.revenue)} hint={`${stats.paidOrders} paid orders`} />
        <Stat label="Awaiting verification" value={String(stats.awaitingOrders)} hint="Manual MoMo / bank transfers" />
        <Stat label="Pending" value={String(stats.pendingOrders)} hint="Started but not paid" />
      </div>

      <OrdersTable
        currentFilter={status}
        orders={orders.map((order) => ({
          id: order.id,
          reference: order.reference,
          name: order.name,
          email: order.email,
          phone: order.phone,
          country: order.country,
          total: order.total,
          currency: order.currency,
          status: order.status,
          paymentMethod: order.paymentMethod,
          payerNote: order.payerNote,
          paymentRef: order.paymentRef,
          note: order.note,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            title: item.title,
            licenseName: item.licenseName,
            price: item.price,
            tier: item.tier,
          })),
          paystackEnabled: paystackEnabled(),
        }))}
      />
    </div>
  );
}
