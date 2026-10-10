import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, FileText, RefreshCw } from "lucide-react";
import { getOrderByReference, downloadsForOrder } from "@/lib/data/sales";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { emailMode } from "@/lib/email";

export const metadata: Metadata = { title: "Order complete" };

export default async function SuccessPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = getOrderByReference(reference);
  if (!order) notFound();
  const settings = await getSettings();
  const downloads = downloadsForOrder(order.id);
  const pending = order.status !== "paid";

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center border border-accent bg-accent-600/15 text-accent-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 display text-3xl text-ash-50">
            {pending ? "Almost there" : "Payment received — enjoy the beat"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ash-400">
            {pending
              ? `Order ${order.reference} is waiting on payment confirmation. As soon as it clears, your download links are emailed to ${order.email}.`
              : `Order ${order.reference} is paid. A delivery email with every download link and your licence PDF is on its way to ${order.email}.`}
          </p>
          <p className="mono-sm nums mt-3 text-ash-500">
            {order.reference} · {formatDate(order.paidAt ?? order.createdAt, true)} ·{" "}
            {formatMoney(order.total, order.currency)} ·{""}
            {order.paymentMethod.replace("_", "")}
          </p>
        </div>

        {emailMode() === "outbox" && (
          <p className="mt-6 border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-center text-xs text-amber-200">
            Email delivery is in <strong>preview mode</strong> (no Resend key configured). Every
            email is rendered and stored — read the exact delivery email in the admin{""}
            <Link href="/admin/outbox" className="underline">
              Outbox
            </Link>
            .
          </p>
        )}

        <div className="mt-10 border border-ink-700 bg-ink-850">
          <h2 className="mono-sm border-b border-ink-700 px-5 py-3 text-accent">Your files</h2>
          <div className="p-5 sm:p-6">
            {pending ? (
              <p className="mt-3 text-sm text-ash-400">
                Downloads unlock the moment the payment is verified. Nothing else is needed from
                you.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {order.items.map((item) => {
                  const download = downloads.find((d) => d.orderItemId === item.id);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 border border-ink-700 bg-ink-850 p-4"
                    >
                      <div className="min-w-0">
                        <p className="headline truncate text-ash-50">{item.title}</p>
                        <p className="mono-sm text-ash-500">
                          {item.licenseName}
                          {item.fileFormat ? ` · ${item.fileFormat}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {download?.fileUrl ? (
                          <a
                            href={`/api/download/${download.token}?download=1`}
                            className="btn btn-primary btn-sm"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        ) : (
                          <span className="chip">File coming shortly</span>
                        )}
                        {download && (
                          <a
                            href={`/api/download/${download.token}/license?download=1`}
                            className="btn btn-secondary btn-sm"
                          >
                            <FileText className="h-3.5 w-3.5" /> Licence PDF
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/account" className="btn btn-secondary btn-sm">
                <RefreshCw className="h-3.5 w-3.5" /> Open my dashboard
              </Link>
              <Link href="/beats" className="btn btn-ghost btn-sm">
                Keep browsing beats <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-700 pt-4">
          <h2 className="mono-sm text-ash-500">Receipt &amp; licence</h2>
          <ul className="mt-3 space-y-2 text-sm text-ash-400">
            <li>· A receipt email is sent for every payment.</li>
            <li>· The licence PDF carries your name, the beat details and the order reference.</li>
            <li>· Download links stay valid for 30 days (15 downloads each).</li>
            <li>
              · Questions? Reply to the delivery email or write to{""}
              <a href={`mailto:${settings.support_email}`} className="link-accent">
                {settings.support_email}
              </a>
              .
            </li>
          </ul>
        </div>

        <div className="mt-6 flex items-center gap-4 border border-ink-700 bg-ink-850 p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-ink-700 bg-ink-850">
            {order.items[0]?.beatId ? (
              <Image src="/studio.svg" alt="" fill sizes="56px" className="object-cover" />
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-ash-400">
            <strong className="text-ash-200">Free mix included on premium &amp; exclusive.</strong>{" "}
            Send the finished track to {settings.support_email} with your order reference and it
            comes back polished.
          </p>
        </div>
      </div>
    </div>
  );
}
