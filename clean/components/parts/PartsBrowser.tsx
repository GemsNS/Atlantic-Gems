"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PartCard } from "@/components/parts/PartCard";
import { PartMedia } from "@/components/parts/PartMedia";
import { StockGauge } from "@/components/parts/StockGauge";
import { QtyStepper } from "@/components/parts/QtyStepper";
import {
  GridIcon,
  ListIcon,
  NoResultIcon,
  SearchIcon,
  SlidersIcon,
} from "@/components/shop/Icons";
import { PART_CATEGORIES, partCategoryLabel, type Part, type PartCategory } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { stockNote, stockTone } from "@/lib/parts/visuals";

type Sort = "title" | "price-asc" | "price-desc" | "stock";
type View = "tray" | "ledger";
type Facet = "q" | "category" | "brand" | "inStock";

const SORTS: { value: Sort; label: string }[] = [
  { value: "title", label: "Name, A to Z" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "stock", label: "Most on the shelf" },
];

function haystack(p: Part): string {
  return `${p.title} ${p.sku} ${p.brand} ${p.description} ${partCategoryLabel(p.category)}`.toLowerCase();
}

/**
 * The counter itself: search, brand and category facets over a tray of parts,
 * with quantity and add-to-quote on every line so an order can be built
 * without leaving the page.
 */
export function PartsBrowser({
  parts,
  csrf,
  /** Locked to one tray on a category page; free across the whole counter on /parts. */
  fixedCategory,
  /** Static export has no cart, so quick-add is hidden there. */
  canQuote = true,
}: {
  parts: Part[];
  csrf?: string;
  fixedCategory?: PartCategory;
  canQuote?: boolean;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("title");
  const [view, setView] = useState<View>("tray");
  const [railOpen, setRailOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const tag = el instanceof HTMLElement ? el.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const needle = q.trim().toLowerCase();

  const tests = useMemo(
    () =>
      ({
        q: (p: Part) => !needle || haystack(p).includes(needle),
        category: (p: Part) => category === "all" || p.category === category,
        brand: (p: Part) => brand === "all" || (p.brand || "Unbranded") === brand,
        inStock: (p: Part) => !inStock || p.stockQty > 0,
      }) satisfies Record<Facet, (p: Part) => boolean>,
    [needle, category, brand, inStock],
  );

  const passes = useMemo(() => {
    const keys = Object.keys(tests) as Facet[];
    return (p: Part, skip?: Facet) => keys.every((k) => k === skip || tests[k](p));
  }, [tests]);

  const shown = useMemo(() => {
    const list = parts.filter((p) => passes(p));
    const price = (p: Part) => (p.price === null ? Number.POSITIVE_INFINITY : p.price);
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") list.sort((a, b) => price(b) - price(a));
    else if (sort === "stock") list.sort((a, b) => b.stockQty - a.stockQty);
    else list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [parts, passes, sort]);

  const countIf = (skip: Facet, match: (p: Part) => boolean) =>
    parts.filter((p) => passes(p, skip) && match(p)).length;

  const cats = useMemo(
    () => PART_CATEGORIES.filter((c) => parts.some((p) => p.category === c.value)),
    [parts],
  );
  const brands = useMemo(() => {
    const names = new Set(parts.map((p) => p.brand || "Unbranded"));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [parts]);

  const applied: { key: string; label: string; clear: () => void }[] = [];
  if (category !== "all")
    applied.push({ key: "c", label: partCategoryLabel(category), clear: () => setCategory("all") });
  if (brand !== "all") applied.push({ key: "b", label: brand, clear: () => setBrand("all") });
  if (inStock) applied.push({ key: "s", label: "In stock only", clear: () => setInStock(false) });
  if (needle) applied.push({ key: "q", label: `“${q.trim()}”`, clear: () => setQ("") });

  const resetAll = () => {
    setQ("");
    setCategory("all");
    setBrand("all");
    setInStock(false);
  };

  const showRail = (!fixedCategory && cats.length > 1) || brands.length > 1;
  const settleKey = `${category}|${brand}|${inStock}|${sort}|${view}`;
  const quickAdd = canQuote && Boolean(csrf);

  const results =
    shown.length === 0 ? (
      <div className="empty-state">
        <NoResultIcon />
        <h3>Nothing on this tray matches</h3>
        <p>
          The counter list is not everything we can get. Send the reference or a photograph of the
          part and we will price it.
        </p>
        <div className="empty-actions">
          {applied.length ? (
            <button type="button" className="btn btn-ghost" onClick={resetAll}>
              Clear filters
            </button>
          ) : null}
          <Link href="/contact" className="btn btn-primary">
            Ask for an unlisted part
          </Link>
        </div>
      </div>
    ) : view === "tray" ? (
      <div className="part-grid is-settling" key={settleKey}>
        {shown.map((p) => (
          <PartCard key={p.id} part={p} csrf={csrf} showQuickAdd={quickAdd} />
        ))}
      </div>
    ) : (
      <div className="inv-ledger is-settling" key={settleKey}>
        {shown.map((p) => (
          <PartLedgerRow key={p.id} part={p} csrf={csrf} quickAdd={quickAdd} />
        ))}
      </div>
    );

  return (
    <div className={showRail ? "browse" : undefined}>
      {showRail ? (
        <>
          <button
            type="button"
            className="rail-toggle"
            aria-expanded={railOpen}
            aria-controls="parts-rail"
            onClick={() => setRailOpen((o) => !o)}
          >
            <SlidersIcon />
            {railOpen ? "Hide filters" : "Filters"}
            {applied.length ? <span className="chip-n">{applied.length}</span> : null}
          </button>

          <aside
            className="browse-rail"
            id="parts-rail"
            data-open={railOpen ? "true" : "false"}
            aria-label="Filter the counter"
          >
            {!fixedCategory && cats.length > 1 ? (
              <div className="rail-group">
                <p className="rail-title">Tray</p>
                <ul className="rail-list">
                  <li>
                    <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
                      Everything
                      <span className="chip-n">{countIf("category", () => true)}</span>
                    </button>
                  </li>
                  {cats.map((c) => (
                    <li key={c.value}>
                      <button
                        type="button"
                        aria-pressed={category === c.value}
                        onClick={() => setCategory(category === c.value ? "all" : c.value)}
                      >
                        {c.label}
                        <span className="chip-n">{countIf("category", (p) => p.category === c.value)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {brands.length > 1 ? (
              <div className="rail-group">
                <p className="rail-title">Brand</p>
                <ul className="rail-list">
                  {brands.map((b) => (
                    <li key={b}>
                      <button
                        type="button"
                        aria-pressed={brand === b}
                        onClick={() => setBrand(brand === b ? "all" : b)}
                      >
                        {b}
                        <span className="chip-n">{countIf("brand", (p) => (p.brand || "Unbranded") === b)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rail-group">
              <p className="rail-title">Show</p>
              <label className="rail-switch">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                On the shelf now
              </label>
            </div>

            <p className="rail-note">
              Trade accounts are priced separately. Demo lines are marked while the live list is
              confirmed.
            </p>
          </aside>
        </>
      ) : null}

      <div>
        <div className="filters">
          <div className="filters-bar">
            <div className="search">
              <SearchIcon className="search-icon" />
              <label className="sr-only" htmlFor="parts-search">
                Search parts
              </label>
              <input
                id="parts-search"
                ref={searchRef}
                type="search"
                placeholder="Search part, SKU or brand"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q ? (
                <button type="button" className="search-clear" onClick={() => setQ("")} aria-label="Clear search">
                  ✕
                </button>
              ) : (
                <span className="search-kbd" aria-hidden="true">
                  <kbd>/</kbd>
                </span>
              )}
            </div>

            <div className="select">
              <label className="sr-only" htmlFor="parts-sort">
                Sort
              </label>
              <select id="parts-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="viewtoggle" role="group" aria-label="Layout">
              <button type="button" aria-pressed={view === "tray"} onClick={() => setView("tray")}>
                <GridIcon />
                Tray
              </button>
              <button type="button" aria-pressed={view === "ledger"} onClick={() => setView("ledger")}>
                <ListIcon />
                Price list
              </button>
            </div>
          </div>

          {applied.length ? (
            <div className="applied">
              <span className="applied-label">Filtering by</span>
              {applied.map((a) => (
                <span key={a.key} className="pill">
                  {a.label}
                  <button type="button" onClick={a.clear} aria-label={`Remove filter ${a.label}`}>
                    ✕
                  </button>
                </span>
              ))}
              <button type="button" className="btn-link" onClick={resetAll}>
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        <p className="result-line" aria-live="polite">
          <span>
            <strong>{shown.length}</strong> {shown.length === 1 ? "line" : "lines"}
            {shown.length !== parts.length ? ` of ${parts.length}` : ""}
          </span>
          <span>{view === "ledger" ? "Price list" : "Tray view"}</span>
        </p>

        {results}
      </div>
    </div>
  );
}

function PartLedgerRow({ part, csrf, quickAdd }: { part: Part; csrf?: string; quickAdd: boolean }) {
  const tone = stockTone(part.stockQty, part.reorderPoint);
  const out = tone === "out";
  return (
    <article className="led-row">
      <span className="led-thumb">
        <PartMedia category={part.category} artKey={part.art} seed={part.sku} size="sm" alt={part.title} />
      </span>
      <div className="led-main">
        <h3 className="led-title">
          <Link href={`/parts/item/${part.id}`}>{part.title}</Link>
        </h3>
        <p className="led-meta">
          <span className="led-ref">{part.sku}</span>
          {part.brand ? <span>{part.brand}</span> : null}
          <span>Pack {part.packSize}</span>
          <StockGauge
            qty={part.stockQty}
            reorder={part.reorderPoint}
            label={stockNote(part.stockQty, part.reorderPoint)}
            inline
          />
        </p>
      </div>
      <p className="led-price">{formatMoney(part.price, part.currency)}</p>
      <div className="led-actions">
        {quickAdd && csrf && !out ? (
          <form action="/api/cart/add" method="post" className="cart-qty-form">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="partId" value={part.id} />
            <QtyStepper label={`Quantity of ${part.title}`} />
            <button type="submit" className="btn btn-ghost btn-small">
              Add
            </button>
          </form>
        ) : (
          <Link href={`/parts/item/${part.id}`} className="btn btn-ghost btn-small">
            {out ? "Lead time" : "View"}
          </Link>
        )}
      </div>
    </article>
  );
}
