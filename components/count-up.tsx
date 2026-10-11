"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Numbers that count up when they scroll into view.
 *
 * Renders the final value on the server, so crawlers and no-JS visitors see a
 * real figure — the count is pure decoration on top. Honours the theme's calm
 * mode (and the OS preference) by skipping straight to the number.
 */
export function CountUp({
  value,
  duration = 1300,
  format,
  className,
  delay = 0,
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
  delay?: number;
}) {
  const formatValue = format ?? ((n: number) => Math.round(n).toLocaleString());
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started.current) return;

    const motionScale = Number(
      getComputedStyle(document.documentElement).getPropertyValue("--motion-scale") || "1",
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The initial state is already the final number, so bailing out here is
    // enough — nothing is rendered at zero waiting for an animation.
    if (reduced || motionScale < 0.05 || value === 0) return;

    let frame = 0;
    let timer = 0;

    const run = () => {
      started.current = true;
      const from = 0;
      const to = value;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - t0) / duration, 1);
        // easeOutQuint — fast off the mark, settles gently
        const eased = 1 - Math.pow(1 - t, 5);
        setDisplay(from + (to - from) * eased);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            timer = window.setTimeout(run, delay);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {formatValue(display)}
    </span>
  );
}
