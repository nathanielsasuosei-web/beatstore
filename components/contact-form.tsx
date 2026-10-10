"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { safeJson } from "@/lib/api-client";

type Topic = { id: string; label: string };

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
  topics,
  defaultTopic = "general",
  defaultSubject = "",
  defaultBody = "",
  defaultReference = "",
  compact = false,
}: {
  defaultName?: string;
  defaultEmail?: string;
  topics: Topic[];
  defaultTopic?: string;
  defaultSubject?: string;
  defaultBody?: string;
  defaultReference?: string;
  compact?: boolean;
}) {
  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    subject: defaultSubject,
    body: defaultBody,
    topic: defaultTopic,
    orderReference: defaultReference,
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not send your message.");
      setState("sent");
      setMessage("Message sent — a copy is on its way to your inbox.");
      setForm((current) => ({ ...current, subject: "", body: "" }));
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (state === "sent") {
    return (
      <div className="border border-ink-700 bg-ink-850 p-10 text-center">
        <p className="mono-sm text-accent">Sent</p>
        <h2 className="headline mt-3 text-lg text-ash-50">Message received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ash-400">{message}</p>
        <button type="button" onClick={() => setState("idle")} className="btn btn-secondary btn-sm">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink-700 bg-ink-850 p-5 sm:p-6">
      <h2 className="headline text-lg text-ash-50">Send a message</h2>
      <p className="mono-sm mt-1.5 leading-relaxed text-ash-500">
        You&apos;ll get an email copy of your message straight away, and the reply lands in your
        inbox.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="Kojo Wavez"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label className="label" htmlFor="topic">
            What&apos;s it about?
          </label>
          <select
            id="topic"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="select"
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="reference">
            Order reference (optional)
          </label>
          <input
            id="reference"
            value={form.orderReference}
            onChange={(e) => setForm({ ...form, orderReference: e.target.value })}
            className="input"
            placeholder="NSO-ABC123"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="input"
          placeholder="Need a custom afrobeats beat for my EP"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="body">
          Message
        </label>
        <textarea
          id="body"
          required
          rows={6}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="textarea resize-y"
          placeholder="Tell me about the record: references, tempo, deadline, and whether you need stems."
        />
      </div>

      {state === "error" && (
        <p className="mt-4 border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn btn-primary btn-lg mt-5 w-full"
      >
        {state === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send message
          </>
        )}
      </button>
    </form>
  );
}
