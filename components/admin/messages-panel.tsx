"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, CornerUpLeft, Loader2, Mail, MailOpen, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  topic: string;
  direction: string;
  status: string;
  createdAt: string;
  orderReference: string | null;
};

export function MessagesPanel({ messages }: { messages: AdminMessage[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const inbound = messages.filter((message) => message.direction !== "outbound");
  const open = messages.find((message) => message.id === openId) ?? null;

  async function act(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Action failed");
      if (body.action === "reply") {
        setFlash(
          json.delivered === "sent"
            ? "Reply sent by email."
            : "Reply saved. Email delivery is in preview mode — open the Outbox to see it."
        );
        setReply("");
      }
      router.refresh();
    } catch (error) {
      setFlash(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-2">
        {inbound.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => {
              setOpenId(message.id);
              if (message.status === "new") void act(message.id, { action: "read" });
            }}
            className={`surface-card w-full p-4 text-left transition ${
              openId === message.id ? "border-lime-400/50 ring-1 ring-lime-400/20" : "hover:border-ink-600"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold">{message.name}</p>
              <span className="shrink-0 text-[11px] text-zinc-500">{formatDate(message.createdAt)}</span>
            </div>
            <p className="mt-1 truncate text-xs text-zinc-400">{message.subject}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="chip">{message.topic}</span>
              {message.status === "new" && <span className="badge bg-lime-400 text-ink-950">New</span>}
              {message.status === "replied" && <span className="badge bg-ink-700 text-zinc-400">Replied</span>}
              {message.status === "archived" && <span className="badge bg-ink-700 text-zinc-500">Archived</span>}
            </div>
          </button>
        ))}
        {inbound.length === 0 && (
          <div className="surface-card grid place-items-center py-14 text-sm text-zinc-500">
            The inbox is empty.
          </div>
        )}
      </div>

      <div className="surface-card h-fit p-5">
        {!open ? (
          <p className="text-sm text-zinc-500">Select a message to read it.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{open.subject}</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  From <span className="text-zinc-200">{open.name}</span> ·{" "}
                  <a href={`mailto:${open.email}`} className="hover:text-lime-300">
                    {open.email}
                  </a>{" "}
                  · {formatDate(open.createdAt, true)}
                </p>
                {open.orderReference && (
                  <p className="mt-1 text-xs text-zinc-500">Order: {open.orderReference}</p>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => act(open.id, { action: "new" })}
                  disabled={busy}
                  className="btn btn-ghost btn-sm"
                  title="Mark unread"
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => act(open.id, { action: "archive" })}
                  disabled={busy}
                  className="btn btn-ghost btn-sm"
                  title="Archive"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => act(open.id, { action: "delete" })}
                  disabled={busy}
                  className="btn btn-ghost btn-sm text-zinc-500 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 whitespace-pre-line rounded-2xl border border-ink-700 bg-ink-850 p-4 text-sm leading-relaxed text-zinc-300">
              {open.body}
            </div>

            {open.direction === "outbound" ? (
              <p className="mt-4 text-xs text-zinc-500">
                This entry is a reply you sent. Find the original above to continue the thread.
              </p>
            ) : (
              <>
                <label className="label mt-5" htmlFor="reply">
                  Reply by email
                </label>
                <textarea
                  id="reply"
                  rows={6}
                  className="textarea resize-y"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Hi ${open.name.split(" ")[0]}, thanks for reaching out…`}
                />
                {flash && (
                  <p className="mt-3 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-200">
                    {flash}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => act(open.id, { action: "reply", replyBody: reply })}
                    disabled={busy || !reply.trim()}
                    className="btn btn-primary"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send reply
                  </button>
                  <a
                    href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}
                    className="btn btn-secondary"
                  >
                    <MailOpen className="h-4 w-4" /> Open in mail app
                  </a>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CornerUpLeft className="h-3.5 w-3.5" /> Reply goes out as an email and is saved on the thread.
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
