import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  index,
  title,
  blurb,
  action,
  className,
}: {
  eyebrow?: string;
  index?: string;
  title: string;
  blurb?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("section-head", className)}>
      <div className="max-w-2xl">
        {(index || eyebrow) && <p className="section-index nums">{index ?? eyebrow}</p>}
        <h2 className="headline mt-2 text-2xl text-ash-50 sm:text-3xl">{title}</h2>
        {blurb && <p className="mt-3 max-w-xl text-sm leading-relaxed text-ash-400">{blurb}</p>}
      </div>
      {action && (
        <Link href={action.href} className="arrow-link shrink-0">
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-t border-ink-600 pt-3">
      <p className="mono-sm text-ash-500">{label}</p>
      <p className="display mt-2 text-2xl text-ash-50 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-ash-500">{hint}</p>}
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
    <div className="border border-dashed border-ink-600 px-6 py-16 text-center">
      <p className="headline text-lg text-ash-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ash-400">{blurb}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}
