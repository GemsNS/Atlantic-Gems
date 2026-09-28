"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A status box that arrives with a full page load (a redirect after a form
 * post). Focus moves to it once, so keyboard and screen-reader users land on
 * the outcome instead of the top of the page.
 */
export function FocusOnArrival({
  className,
  role,
  style,
  children,
}: {
  className: string;
  role: "status" | "alert";
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Someone already typing or tabbing before the page hydrated keeps their
    // place; focus moves only if nothing else has it.
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) return;
    ref.current?.focus();
  }, []);
  return (
    <div ref={ref} className={className} role={role} tabIndex={-1} style={style}>
      {children}
    </div>
  );
}
