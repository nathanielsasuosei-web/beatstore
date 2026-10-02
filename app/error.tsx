"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Something went off key</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        The page hit an unexpected error. Try again — if it keeps happening the details below help track it down.
      </p>
      <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-left text-[11px] text-zinc-500">
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
  );
}
