"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl border border-ink-700 bg-ink-850 p-8 text-center">
        <p className="mono-sm text-accent">Error</p>
        <h1 className="display mt-4 text-4xl text-ash-50">Something went off key</h1>
        <p className="mt-4 text-sm leading-relaxed text-ash-400">
          The page hit an unexpected error. Try again — if it keeps happening, the note below helps
          track it down.
        </p>
        <pre className="mt-5 overflow-x-auto border border-ink-700 bg-ink-900 px-3 py-2 text-left font-mono text-[11px] text-ash-500">
          {error.message}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-primary btn-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
          <Link href="/" className="btn btn-secondary btn-sm">
            Back to the store
          </Link>
        </div>
      </div>
    </div>
  );
}
