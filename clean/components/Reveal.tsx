"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades children in when they enter the viewport. Falls back to visible when
 * IntersectionObserver is unavailable or reduced motion is requested.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const props = {
    ref: (el: HTMLElement | null) => {
      ref.current = el;
    },
    className: `reveal ${className}`.trim(),
    "data-delay": delay || undefined,
  };

  if (Tag === "section") return <section {...props}>{children}</section>;
  if (Tag === "li") return <li {...props}>{children}</li>;
  return <div {...props}>{children}</div>;
}
