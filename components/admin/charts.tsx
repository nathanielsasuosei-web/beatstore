"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { formatMoney } from "@/lib/money";
import { cn, cssVars } from "@/lib/utils";
import type { SeriesPoint } from "@/lib/data/analytics";

/* ══════════════════════════════════════════════════════════════
   Sparkline — a shape, not a sentence. No axes, no labels.
   ══════════════════════════════════════════════════════════════ */

export function Sparkline({
  points,
  className,
  delay = 0,
}: {
  points: number[];
  className?: string;
  delay?: number;
}) {
  const path = useMemo(() => {
    if (points.length < 2) return "";
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const step = 100 / (points.length - 1);
    return points
      .map((point, index) => {
        const x = index * step;
        const y = 28 - ((point - min) / span) * 24 - 2;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="spark-line"
        style={cssVars({ "--d": `${delay}ms` })}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI tile
   ══════════════════════════════════════════════════════════════ */

export function KpiTile({
  label,
  value,
  money,
  delta,
  hint,
  series,
  icon,
  href,
  delay = 0,
  currency = "GHS",
}: {
  label: string;
  value: number;
  money?: boolean;
  delta?: number;
  hint?: string;
  series?: number[];
  icon?: React.ReactNode;
  href?: string;
  delay?: number;
  currency?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="mono-sm text-ash-500">{label}</p>
        {icon && <span className="text-accent-400/80">{icon}</span>}
      </div>

      <p className="display nums mt-3 text-[1.75rem] leading-none text-ash-50">
        <CountUp
          value={value}
          delay={delay}
          format={money ? (n) => formatMoney(Math.round(n), currency) : undefined}
          className="nums-glow"
        />
      </p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {typeof delta === "number" && (
            <span
              className={cn(
                "mono-sm inline-flex items-center gap-1",
                up ? "text-accent-300" : "text-red-300",
              )}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? "+" : ""}
              {delta}% vs prev
            </span>
          )}
          {hint && <p className="mono-sm mt-1 truncate text-ash-600">{hint}</p>}
        </div>
        {series && series.some((point) => point > 0) && (
          <Sparkline points={series} className="max-w-[7.5rem] text-accent" delay={delay + 120} />
        )}
      </div>
    </>
  );

  const className =
    "kpi-tile glass rise block p-5 text-left";
  const style = cssVars({ "--d": `${delay}ms` });

  return href ? (
    <Link href={href} className={className} style={style}>
      {body}
    </Link>
  ) : (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Revenue chart — area + line, animated draw, hover readout
   ══════════════════════════════════════════════════════════════ */

const W = 720;
const H = 210;

export function RevenueChart({
  series,
  currency = "GHS",
  ranges = ["7", "30", "90"],
  initialRange = "30",
}: {
  series: Record<string, SeriesPoint[]>;
  currency?: string;
  ranges?: string[];
  initialRange?: string;
}) {
  const [range, setRange] = useState(initialRange);
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(() => series[range] ?? [], [series, range]);
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const max = Math.max(...points.map((point) => point.revenue), 1);
    const step = points.length > 1 ? W / (points.length - 1) : W;
    const coords = points.map((point, index) => ({
      x: index * step,
      y: H - 18 - (point.revenue / max) * (H - 40),
      ...point,
    }));
    const line = coords
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;
    return { coords, line, area, max };
  }, [points]);

  const total = points.reduce((sum, point) => sum + point.revenue, 0);
  const orders = points.reduce((sum, point) => sum + point.orders, 0);
  const best = points.reduce<SeriesPoint | null>(
    (top, point) => (!top || point.revenue > top.revenue ? point : top),
    null,
  );
  const activeIndex = active ?? 0;
  const activePoint = active !== null ? geometry?.coords[activeIndex] : null;

  function track(event: React.PointerEvent<SVGSVGElement>) {
    const node = svgRef.current;
    if (!node || points.length === 0) return;
    const box = node.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    setActive(Math.round(ratio * (points.length - 1)));
  }

  return (
    <div className="glass rise p-5" style={cssVars({ "--d": "80ms" })}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono-sm flex items-center gap-2 text-ash-500">
            <span className="live-dot" aria-hidden />
            Revenue
          </p>
          <p className="display nums mt-2 text-3xl text-ash-50">
            <CountUp value={total} format={(n) => formatMoney(Math.round(n), currency)} />
          </p>
          <p className="mono-sm mt-1.5 text-ash-500">
            {orders} order{orders === 1 ? "" : "s"} ·{" "}
            {best && best.revenue > 0 ? `best day ${best.day.slice(5)}` : "no sales in range yet"}
          </p>
        </div>

        <div className="glass flex gap-1 p-1" style={{ borderRadius: "var(--radius-ui)" }}>
          {ranges.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setRange(option);
                setActive(null);
              }}
              aria-pressed={range === option}
              className={cn(
                "mono-sm px-2.5 py-1.5 transition-colors",
                range === option
                  ? "bg-accent text-[color:var(--accent-on)]"
                  : "text-ash-400 hover:text-ash-100",
              )}
              style={{ borderRadius: "calc(var(--radius-ui) - 1px)" }}
            >
              {option}D
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[190px] w-full touch-none"
          onPointerMove={track}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
              <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* horizontal guides */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              className="chart-grid"
              x1={0}
              x2={W}
              y1={H - 18 - ratio * (H - 40)}
              y2={H - 18 - ratio * (H - 40)}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {geometry && (
            <>
              <path d={geometry.area} fill="url(#revenue-fill)" className="chart-area" />
              <path
                key={`${range}-line`}
                d={geometry.line}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="chart-line"
                style={cssVars({ "--dash": "4200" })}
              />
            </>
          )}

          {activePoint && (
            <>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={12}
                y2={H - 18}
                stroke="var(--accent)"
                strokeOpacity="0.4"
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r={4} fill="var(--accent)" />
            </>
          )}
        </svg>

        {/* hover readout, positioned in HTML so the type stays crisp */}
        {activePoint && (
          <div
            className="glass-strong pointer-events-none absolute top-0 z-10 px-3 py-2"
            style={{
              left: `${(activeIndex / Math.max(points.length - 1, 1)) * 100}%`,
              transform: `translateX(${activeIndex > points.length / 2 ? "-105%" : "5%"})`,
              borderRadius: "var(--radius-ui)",
            }}
          >
            <p className="mono-sm text-ash-500">{activePoint.day}</p>
            <p className="headline nums text-sm text-ash-50">
              {formatMoney(activePoint.revenue, currency)}
            </p>
            <p className="mono-sm text-ash-500">
              {activePoint.orders} order{activePoint.orders === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {/* x labels: first, middle, last */}
        <div className="mono-sm mt-1 flex justify-between text-ash-600">
          <span>{points[0]?.day.slice(5) ?? ""}</span>
          <span>{points[Math.floor(points.length / 2)]?.day.slice(5) ?? ""}</span>
          <span>{points[points.length - 1]?.day.slice(5) ?? ""}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Donut — payment mix
   ══════════════════════════════════════════════════════════════ */

export function Donut({
  slices,
  currency = "GHS",
  label,
  delay = 0,
}: {
  slices: { label: string; value: number; accent?: boolean }[];
  currency?: string;
  label: string;
  delay?: number;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const rendered = slices.map((slice, index) => {
    const share = total > 0 ? slice.value / total : 0;
    return {
      ...slice,
      share,
      length: share * circumference,
      // each segment starts where every earlier segment ended
      offset: slices
        .slice(0, index)
        .reduce(
          (sum, earlier) =>
            sum + (total > 0 ? earlier.value / total : 0) * circumference,
          0,
        ),
      alpha: 1 - index * 0.22,
    };
  });

  return (
    <div className="glass rise p-5" style={cssVars({ "--d": `${delay}ms` })}>
      <p className="mono-sm text-ash-500">{label}</p>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-[110px] w-[110px] shrink-0">
          <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="var(--color-ink-700)"
              strokeWidth="11"
            />
            {rendered.map((segment) => (
              <circle
                key={segment.label}
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeOpacity={segment.alpha}
                strokeWidth="11"
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
                className="chart-area"
              />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="mono-sm text-ash-500">total</p>
              <p className="headline nums text-[13px] text-ash-50">
                {formatMoney(total, currency)}
              </p>
            </div>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {rendered.map((segment) => (
            <li key={segment.label} className="flex items-center gap-2.5 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0"
                style={{ background: "var(--accent)", opacity: segment.alpha, borderRadius: 1 }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-ash-300">{segment.label}</span>
              <span className="nums text-ash-500">{Math.round(segment.share * 100)}%</span>
            </li>
          ))}
          {rendered.length === 0 && <li className="text-xs text-ash-600">No payments yet.</li>}
        </ul>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Bar list — used for tiers, genres and crate favourites
   ══════════════════════════════════════════════════════════════ */

export function BarList({
  items,
  currency,
  label,
  delay = 0,
  action,
}: {
  items: { key: string; label: string; value: number; hint?: string; href?: string }[];
  currency?: string;
  label: string;
  delay?: number;
  action?: { href: string; label: string };
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="glass rise p-5" style={cssVars({ "--d": `${delay}ms` })}>
      <div className="flex items-center justify-between gap-3">
        <p className="mono-sm text-ash-500">{label}</p>
        {action && (
          <Link
            href={action.href}
            className="mono-sm flex items-center gap-1 text-accent-300 hover:underline"
          >
            {action.label}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <ul className="mt-4 space-y-3.5">
        {items.map((item, index) => {
          const width = (item.value / max) * 100;
          const row = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ash-200">{item.label}</span>
                <span className="mono-sm nums shrink-0 text-ash-400">
                  {currency ? formatMoney(item.value, currency) : item.value.toLocaleString()}
                </span>
              </span>
              <span className="mt-1.5 block h-1 w-full overflow-hidden bg-ink-800">
                <span
                  className="block h-full origin-left bg-accent"
                  style={{
                    width: `${width}%`,
                    transform: mounted ? "scaleX(1)" : "scaleX(0)",
                    transition: `transform 700ms var(--ease-out-quint) ${index * 70}ms`,
                  }}
                />
              </span>
              {item.hint && <span className="mono-sm mt-1 block text-ash-600">{item.hint}</span>}
            </>
          );

          return (
            <li key={item.key}>
              {item.href ? (
                <Link href={item.href} className="block transition-opacity hover:opacity-80">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-ash-600">Nothing to show yet.</li>}
      </ul>
    </div>
  );
}
