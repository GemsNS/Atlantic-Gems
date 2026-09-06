"use client";

import { useMemo, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { CATEGORIES, CONDITIONS, type InventoryItem } from "@/lib/inventory/types";

type Sort = "newest" | "price-asc" | "price-desc";

export function InventoryBrowser({ items, hrefBase }: { items: InventoryItem[]; hrefBase?: string }) {
  const [category, setCategory] = useState<string>("all");
  const [condition, setCondition] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [q, setQ] = useState("");

  const cats = useMemo(
    () => CATEGORIES.filter((c) => items.some((i) => i.category === c.value)),
    [items],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (category === "all" || i.category === category) &&
        (condition === "all" || i.condition === condition) &&
        (!needle ||
          `${i.title} ${i.metal} ${i.stones} ${i.description}`.toLowerCase().includes(needle)),
    );
    const price = (i: InventoryItem) => (i.price === null ? Number.POSITIVE_INFINITY : i.price);
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") list.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
    return list;
  }, [items, category, condition, sort, q]);

  return (
    <div className="inv">
      <div className="inv-filters" role="group" aria-label="Filter the collection">
        <div className="seg" role="group" aria-label="Category">
          <button type="button" className="seg-btn" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
            All
          </button>
          {cats.map((c) => (
            <button
              key={c.value}
              type="button"
              className="seg-btn"
              aria-pressed={category === c.value}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Condition">
          <button type="button" className="seg-btn" aria-pressed={condition === "all"} onClick={() => setCondition("all")}>
            New and pre-owned
          </button>
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              className="seg-btn"
              aria-pressed={condition === c.value}
              onClick={() => setCondition(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="inv-tools">
          <label className="field" style={{ flex: 1 }}>
            <span className="sr-only">Search</span>
            <input type="search" placeholder="Search the collection" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="field">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </select>
          </label>
        </div>
      </div>

      <p className="muted" aria-live="polite" style={{ margin: "14px 0" }}>
        {shown.length} {shown.length === 1 ? "piece" : "pieces"}
      </p>

      {shown.length === 0 ? (
        <div className="empty">
          <p>Nothing matches those filters.</p>
        </div>
      ) : (
        <div className="inv-grid">
          {shown.map((i) => (
            <ItemCard key={i.id} item={i} hrefBase={hrefBase} />
          ))}
        </div>
      )}
    </div>
  );
}
