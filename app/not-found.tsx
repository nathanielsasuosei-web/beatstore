import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl border border-ink-700 bg-ink-850 p-8 text-center">
        <p className="mono-sm text-accent">404</p>
        <h1 className="display mt-4 text-4xl text-ash-50">Off beat</h1>
        <p className="mt-4 text-sm leading-relaxed text-ash-400">
          That link doesn&apos;t exist any more. If it was a beat, it may have been sold exclusively
          and taken off the shelf.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/beats" className="btn btn-primary btn-sm">
            Browse beats
          </Link>
          <Link href="/contact" className="btn btn-secondary btn-sm">
            Message the producer
          </Link>
        </div>
      </div>
    </div>
  );
}
