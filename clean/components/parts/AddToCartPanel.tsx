"use client";

import { useState } from "react";
import Link from "next/link";

export function AddToCartPanel({
  csrf,
  partId,
  disabled,
}: {
  csrf: string;
  partId: string;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);

  return (
    <form action="/api/cart/add" method="post" className="part-buy">
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="partId" value={partId} />
      <div className="part-qty" role="group" aria-label="Quantity">
        <button
          type="button"
          className="part-qty-btn"
          aria-label="Decrease quantity"
          disabled={disabled || qty <= 1}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <input
          type="number"
          name="qty"
          min={1}
          max={999}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
          disabled={disabled}
        />
        <button
          type="button"
          className="part-qty-btn"
          aria-label="Increase quantity"
          disabled={disabled}
          onClick={() => setQty((q) => Math.min(999, q + 1))}
        >
          +
        </button>
      </div>
      <button className="btn btn-primary part-buy-submit" type="submit" disabled={disabled}>
        {disabled ? "Unavailable" : "Add to quote cart"}
      </button>
      <Link href="/cart" className="btn btn-ghost part-buy-cart">
        View cart
      </Link>
    </form>
  );
}
