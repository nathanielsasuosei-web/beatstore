import { listMessages, messageCounts } from "@/lib/data/inbox";
import { MessagesPanel } from "@/components/admin/messages-panel";
import { Stat } from "@/components/section";
import { emailMode } from "@/lib/email";

export default async function AdminMessagesPage() {
  const { messages, total } = listMessages({ status: "all", limit: 100 });
  const counts = messageCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every enquiry from the contact form, an artist dashboard or an order. Replying sends a real email and
          keeps the thread here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="New" value={String(counts.new)} hint="Not opened yet" />
        <Stat label="Total" value={String(total)} hint="All time" />
        <Stat
          label="Delivery mode"
          value={emailMode() === "resend" ? "Resend (live)" : "Preview"}
          hint={emailMode() === "resend" ? "Emails leave the server" : "Replies are stored in the outbox"}
        />
      </div>

      <MessagesPanel
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          email: message.email,
          subject: message.subject,
          body: message.body,
          topic: message.topic,
          direction: message.direction,
          status: message.status,
          createdAt: message.createdAt.toISOString(),
          orderReference: null,
        }))}
      />
    </div>
  );
}
