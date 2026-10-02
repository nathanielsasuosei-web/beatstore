import Link from "next/link";
import { Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-800 text-lime-400">
        <Headphones className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Off beat — page not found</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        That link doesn&apos;t exist any more. The beat may have been sold exclusively and taken off the store.
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
  );
}
