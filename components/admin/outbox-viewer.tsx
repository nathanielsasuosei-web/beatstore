"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Mail, X } from "lucide-react";

export type OutboxEntry = {
  id: string;
  to: string;
  from: string | null;
  subject: string;
  type: string;
  status: string;
  error: string | null;
  html: string | null;
  text: string | null;
  createdAt: string;
};

export function OutboxViewer({ logs }: { logs: OutboxEntry[] }) {
  const [preview, setPreview] = useState<OutboxEntry | null>(null);

  return (
    <>
      <div className="surface-card overflow-x-auto">
        <table className="table-clean min-w-[760px]">
          <thead>
            <tr>
              <th>Sent</th>
              <th>To</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="text-xs text-zinc-500">{log.createdAt}</td>
                <td className="text-xs">{log.to}</td>
                <td className="text-sm">{log.subject}</td>
                <td className="text-xs text-zinc-400">{log.type}</td>
                <td>
                  <span
                    className={`badge ${
                      log.status === "sent"
                        ? "bg-lime-400/15 text-lime-300"
                        : log.status === "failed"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {log.status === "sent" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : log.status === "failed" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    {log.status}
                  </span>
                  {log.error && <p className="mt-1 text-[11px] text-red-400">{log.error}</p>}
                </td>
                <td className="text-right">
                  <button type="button" onClick={() => setPreview(log)} className="btn btn-secondary btn-sm">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                  No emails yet. Place a test order to see the delivery email appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ink-700 bg-ink-900">
            <header className="flex items-start justify-between gap-4 border-b border-ink-700 p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{preview.subject}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  To: {preview.to} · From: {preview.from ?? "—"} · {preview.createdAt}
                </p>
                <span className="badge mt-2 bg-ink-700 text-zinc-300">{preview.type}</span>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="btn btn-ghost btn-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-ink-850 p-4">
              {preview.html ? (
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  className="h-[60vh] w-full rounded-2xl border border-ink-700 bg-black"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-xs text-zinc-400">{preview.text}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
