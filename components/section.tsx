import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {blurb && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{blurb}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn btn-secondary btn-sm">
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  blurb,
  action,
}: {
  title: string;
  blurb: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="surface-card grid place-items-center gap-3 px-6 py-16 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-zinc-400">{blurb}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary btn-sm mt-1">
          {action.label}
        </Link>
      )}
    </div>
  );
}
