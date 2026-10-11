import { listEmailLogs, emailLogStats } from "@/lib/data/inbox";
import { emailMode } from "@/lib/email";
import { OutboxViewer } from "@/components/admin/outbox-viewer";
import { Stat } from "@/components/section";
import { formatDate } from "@/lib/utils";

export default function AdminOutboxPage() {
  const logs = listEmailLogs({ limit: 80 });
  const stats = emailLogStats();
  const mode = emailMode();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl text-ash-50">Email outbox</h1>
        <p className="mt-1 text-sm text-ash-400">
          Every email the store generates — delivery emails, receipts, welcome messages, replies.{" "}
          {mode === "resend"
            ? "Resend is configured, so these were delivered."
            : "Delivery is in preview mode until a Resend API key is set; nothing leaves the server yet."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          label="Sent via Resend"
          value={String(stats.sent)}
          hint="Delivered to the recipient"
        />
        <Stat label="Preview only" value={String(stats.preview)} hint="Waiting for a Resend key" />
        <Stat label="Failed" value={String(stats.failed)} hint="Check the error column" />
        <Stat
          label="Mode"
          value={mode === "resend" ? "Live" : "Preview"}
          hint={
            mode === "resend" ? (process.env.EMAIL_FROM ?? "Resend") : "Add RESEND_API_KEY to send"
          }
        />
      </div>

      <OutboxViewer
        logs={logs.map((log) => ({
          id: log.id,
          to: log.to,
          from: log.from,
          subject: log.subject,
          type: log.type,
          status: log.status,
          error: log.error,
          html: log.html,
          text: log.text,
          createdAt: formatDate(log.createdAt, true),
        }))}
      />
    </div>
  );
}
