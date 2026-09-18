"use client";

import { useId, useState } from "react";

const MIN = 1;
const MAX = 999;

function clamp(n: number): number {
  return Math.max(MIN, Math.min(MAX, Math.round(n) || MIN));
}

/**
 * Quantity field posted with the surrounding form. Arrow keys step by one,
 * Page Up/Down and Shift step by ten, Home/End go to the ends — a bench hand
 * ordering twelve crystals should never have to reach for the mouse.
 */
export function QtyStepper({
  name = "qty",
  label,
  size = "sm",
  disabled = false,
  initial = 1,
}: {
  name?: string;
  label: string;
  size?: "sm" | "lg";
  disabled?: boolean;
  initial?: number;
}) {
  const [qty, setQty] = useState(clamp(initial));
  const id = useId();
  const nudge = (delta: number) => setQty((q) => clamp(q + delta));

  return (
    <span className={`qty${size === "lg" ? " qty-lg" : ""}`} role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || qty <= MIN}
        onClick={() => nudge(-1)}
      >
        −
      </button>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={MIN}
        max={MAX}
        value={qty}
        disabled={disabled}
        onChange={(e) => setQty(clamp(Number(e.target.value)))}
        onKeyDown={(e) => {
          if (e.key === "PageUp") {
            e.preventDefault();
            nudge(10);
          } else if (e.key === "PageDown") {
            e.preventDefault();
            nudge(-10);
          } else if (e.key === "Home") {
            e.preventDefault();
            setQty(MIN);
          } else if (e.key === "End") {
            e.preventDefault();
            setQty(MAX);
          } else if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            nudge(e.key === "ArrowUp" ? 10 : -10);
          }
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || qty >= MAX}
        onClick={() => nudge(1)}
      >
        +
      </button>
    </span>
  );
}
