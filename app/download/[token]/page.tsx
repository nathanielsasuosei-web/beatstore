import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowDownToLine, CheckCircle2, Clock, FileText, Headphones } from "lucide-react";
import { downloadIsUsable, getDownloadContext } from "@/lib/downloads";
import { getSettings } from "@/lib/settings";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Your download" };

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const context = getDownloadContext(token);
  const settings = await getSettings();

  if (!context) {
    return (
      <Shell
        tone="error"
        title="This download link isn't valid"
        body="The link may have been copied incorrectly. Check the delivery email for the original link, or sign in to your dashboard."
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/account" className="btn btn-primary btn-sm">
            Open my dashboard
          </Link>
          <Link href="/contact" className="btn btn-secondary btn-sm">
            Get help
          </Link>
        </div>
      </Shell>
    );
  }

  const { download, order, item, beat } = context;
  const usable = downloadIsUsable(download);
  const remaining = Math.max(0, download.maxDownloads - download.downloads);

  if (!usable.ok) {
    return (
      <Shell tone="warning" title="This link has expired" body={usable.reason}>
        <p className="text-sm text-zinc-400">
          Send a message with order reference <strong className="text-zinc-200">{order.reference}</strong> and
          fresh links are issued straight away.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/contact" className="btn btn-primary btn-sm">
            Request new links
          </Link>
          <Link href="/account" className="btn btn-secondary btn-sm">
            My dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-400/15 text-lime-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{item.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {item.licenseName}
            {item.fileFormat ? ` · ${item.fileFormat}` : ""} · Licensed to {order.name}
          </p>
        </div>

        <div className="surface-card mt-8 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {download.fileUrl ? (
              <a href={`/api/download/${token}?download=1`} className="btn btn-primary btn-lg">
                <ArrowDownToLine className="h-4 w-4" /> Download the beat
              </a>
            ) : (
              <span className="btn btn-secondary btn-lg opacity-60">File unavailable</span>
            )}
            <a href={`/api/download/${token}/license?download=1`} className="btn btn-secondary btn-lg">
              <FileText className="h-4 w-4" /> Licence agreement (PDF)
            </a>
          </div>

          <div className="mt-5 grid gap-3 text-xs text-zinc-400 sm:grid-cols-3">
            <Info label="Order" value={order.reference} />
            <Info label="Downloads left" value={`${remaining} of ${download.maxDownloads}`} />
            <Info label="Link expires" value={formatDate(download.expiresAt)} />
            {beat?.bpm ? <Info label="Tempo" value={`${beat.bpm} BPM`} /> : null}
            {beat?.musicalKey ? <Info label="Key" value={beat.musicalKey} /> : null}
            {beat?.duration ? <Info label="Length" value={formatDuration(beat.duration)} /> : null}
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-2xl border border-ink-700 bg-ink-850 p-3 text-xs text-zinc-400">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-400" />
            {settings.delivery_note} Keep this page bookmarked, or use the link in your email — both work for
            30 days.
          </p>
        </div>

        <div className="surface-card mt-6 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Headphones className="h-4 w-4 text-lime-400" /> Get the most out of this beat
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>· Credit the producer as “Prod. by {settings.producer_name}” where the licence requires it.</li>
            <li>· Premium &amp; exclusive licences include one free mix — send the vocal when it&apos;s ready.</li>
            <li>· Need stems or a different key? Reply to the delivery email and it&apos;s handled.</li>
            <li>· Want the next record early? Join the mailing list by replying “add me”.</li>
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Trouble downloading? Write to{" "}
          <a href={`mailto:${settings.support_email}`} className="link-accent">
            {settings.support_email}
          </a>{" "}
          with order {order.reference}.
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-850 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function Shell({
  tone,
  title,
  body,
  children,
}: {
  tone: "error" | "warning";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page py-16">
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <span
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
            tone === "error" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-300"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-zinc-400">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
