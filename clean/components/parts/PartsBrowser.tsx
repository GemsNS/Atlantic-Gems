"use client";

import Link from "next/link";
import { memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
// Labels come from the zod-free module; the schema in lib/parts/types stays on the server.
import { PART_CATEGORIES, partCategoryLabel, type PartCategory } from "@/lib/parts/categories";
import type { Part } from "@/lib/parts/types";
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

// When a search narrows the list, the cards that stay are not rendered again.
const ShelfCard = memo(PartCard);

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
  const restored = useRef(false);

  // Filters live in the query string so the back button, a reload or a shared
  // link lands on the same view. Read once on mount; `useSearchParams` is
  // avoided on purpose so the static export needs no Suspense boundary.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tray = sp.get("tray");
    if (!fixedCategory && tray && PART_CATEGORIES.some((c) => c.value === tray)) setCategory(tray);
    // Only a brand that is on the counter: the pill must never show text a
    // link made up.
    const b = sp.get("brand");
    if (b && parts.some((p) => (p.brand || "Unbranded") === b)) setBrand(b);
    const qq = sp.get("q");
    if (qq) setQ(qq.slice(0, 120));
    if (sp.get("stock") === "1") setInStock(true);
    const s = sp.get("sort");
    if (s && SORTS.some((o) => o.value === s)) setSort(s as Sort);
    const v = sp.get("view");
    if (v === "tray" || v === "ledger") setView(v);
    restored.current = true;
    // `parts` comes from the server and keeps its identity, so this still runs
    // once; were it to change, reading the URL again (kept in step below) is
    // harmless.
  }, [fixedCategory, parts]);

  useEffect(() => {
    if (!restored.current) return;
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const set = (key: string, value: string | null) => {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      };
      set("q", q.trim() || null);
      set("tray", fixedCategory || category === "all" ? null : category);
      set("brand", brand === "all" ? null : brand);
      set("stock", inStock ? "1" : null);
      set("sort", sort === "title" ? null : sort);
      set("view", view === "tray" ? null : view);
      if (url.href === window.location.href) return;
      try {
        window.history.replaceState(window.history.state, "", url);
      } catch {
        // Some browsers throttle history writes; the view still works without it.
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [q, category, brand, inStock, sort, view, fixedCategory]);

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

  // The list and the counts follow the controls a beat behind: a keystroke or a
  // toggle paints straight away and the grid re-renders in the background, so
  // typing never waits on thirty cards (plan item U11).
  const listNeedle = useDeferredValue(needle);
  const listCategory = useDeferredValue(category);
  const listBrand = useDeferredValue(brand);
  const listInStock = useDeferredValue(inStock);
  const listSort = useDeferredValue(sort);
  const listView = useDeferredValue(view);

  const haystacks = useMemo(() => new Map(parts.map((p) => [p.id, haystack(p)])), [parts]);

  const tests = useMemo(
    () =>
      ({
        q: (p: Part) => !listNeedle || (haystacks.get(p.id) ?? "").includes(listNeedle),
        category: (p: Part) => listCategory === "all" || p.category === listCategory,
        brand: (p: Part) => listBrand === "all" || (p.brand || "Unbranded") === listBrand,
        inStock: (p: Part) => !listInStock || p.stockQty > 0,
      }) satisfies Record<Facet, (p: Part) => boolean>,
    [haystacks, listNeedle, listCategory, listBrand, listInStock],
  );

  const shown = useMemo(() => {
    const list = parts.filter((p) => tests.q(p) && tests.category(p) && tests.brand(p) && tests.inStock(p));
    const price = (p: Part) => (p.price === null ? Number.POSITIVE_INFINITY : p.price);
    if (listSort === "price-asc") list.sort((a, b) => price(a) - price(b));
    else if (listSort === "price-desc") list.sort((a, b) => price(b) - price(a));
    else if (listSort === "stock") list.sort((a, b) => b.stockQty - a.stockQty);
    else list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [parts, tests, listSort]);

  // Facet counts in one pass: a line counts towards a tray (or a brand) when it
  // passes every other active filter.
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byBrand = new Map<string, number>();
    let everyTray = 0;
    for (const p of parts) {
      const inSearch = tests.q(p);
      const inTray = tests.category(p);
      const inBrand = tests.brand(p);
      const onShelf = tests.inStock(p);
      if (inSearch && inBrand && onShelf) {
        everyTray += 1;
        byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
      }
      if (inSearch && inTray && onShelf) {
        const b = p.brand || "Unbranded";
        byBrand.set(b, (byBrand.get(b) ?? 0) + 1);
      }
    }
    return { everyTray, byCategory, byBrand };
  }, [parts, tests]);

  const cats = useMemo(
    () => PART_CATEGORIES.filter((c) => parts.some((p) => p.category === c.value)),
    [parts],
  );
  const brands = useMemo(() => {
    const names = new Set(parts.map((p) => p.brand || "Unbranded"));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [parts]);
  // The demo note goes once the seed lines are retired.
  const hasDemo = useMemo(() => parts.some((p) => p.demo), [parts]);

  const applied: { key: string; label: string; clear: () => void }[] = [];
  if (category !== "all")
    applied.push({ key: "c", label: partCategoryLabel(category), clear: () => setCategory("all") });
  if (brand !== "all") applied.push({ key: "b", label: brand, clear: () => setBrand("all") });
  if (inStock) applied.push({ key: "s", label: "In stock only", clear: () => setInStock(false) });
  if (needle) applied.push({ key: "q", label: `“${q.trim()}”`, clear: () => setQ("") });

  // State setters never change, so this stays the same function between renders.
  const resetAll = useCallback(() => {
    setQ("");
    setCategory("all");
    setBrand("all");
    setInStock(false);
  }, []);

  const showRail = (!fixedCategory && cats.length > 1) || brands.length > 1;
  // Only a filter or sort change remounts the list so it settles in. A search
  // updates the lines in place, and the layout switch swaps the list element
  // whatever the key.
  const settleKey = `${listCategory}|${listBrand}|${listInStock}|${listSort}`;
  const quickAdd = canQuote && Boolean(csrf);

  // Whether the list on screen is filtered, from the same deferred values as the list.
  const listFiltered = listCategory !== "all" || listBrand !== "all" || listInStock || listNeedle !== "";

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
                      <span className="chip-n">{counts.everyTray}</span>
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
                        <span className="chip-n">{counts.byCategory.get(c.value) ?? 0}</span>
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
                        <span className="chip-n">{counts.byBrand.get(b) ?? 0}</span>
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
              Trade accounts are priced separately.
              {hasDemo ? " Demo lines are marked while the live list is confirmed." : null}
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
          <span>{listView === "ledger" ? "Price list" : "Tray view"}</span>
        </p>

        <PartsResults
          shown={shown}
          view={listView}
          settleKey={settleKey}
          csrf={csrf}
          quickAdd={quickAdd}
          filtered={listFiltered}
          onReset={resetAll}
          empty={parts.length === 0}
        />
      </div>
    </div>
  );
}

/**
 * The list, in its own Suspense boundary: React hydrates the search and the
 * toggles first and the cards after, so a tap on the controls never waits for
 * thirty cards. It is memoised so a keystroke or a toggle leaves it alone until
 * the deferred values catch up; new props on a boundary that has not finished
 * hydrating would make React hydrate it on the spot. Nothing in here suspends,
 * so the fallback is never shown.
 */
const PartsResults = memo(function PartsResults({
  shown,
  view,
  settleKey,
  csrf,
  quickAdd,
  filtered,
  onReset,
  empty,
}: {
  shown: Part[];
  view: View;
  settleKey: string;
  csrf?: string;
  quickAdd: boolean;
  filtered: boolean;
  onReset: () => void;
  /** Nothing is listed at all, so no filter can be to blame. */
  empty: boolean;
}) {
  return (
    <Suspense fallback={null}>
      {empty ? (
        <div className="empty-state">
          <NoResultIcon />
          <h3>Nothing is listed here right now</h3>
          <p>
            Stones and parts are still sourced to the job. Send the reference, calibre or a
            photograph and we will price it.
          </p>
          <div className="empty-actions">
            <Link href="/contact" className="btn btn-primary">
              Ask us to source it
            </Link>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <NoResultIcon />
          <h3>Nothing on this tray matches</h3>
          <p>
            The counter list is not everything we can get. Send the reference or a photograph of the
            part and we will price it.
          </p>
          <div className="empty-actions">
            {filtered ? (
              <button type="button" className="btn btn-ghost" onClick={onReset}>
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
            <ShelfCard key={p.id} part={p} csrf={csrf} showQuickAdd={quickAdd} />
          ))}
        </div>
      ) : (
        <div className="inv-ledger is-settling" key={settleKey}>
          {shown.map((p) => (
            <PartLedgerRow key={p.id} part={p} csrf={csrf} quickAdd={quickAdd} />
          ))}
        </div>
      )}
    </Suspense>
  );
});

const PartLedgerRow = memo(function PartLedgerRow({
  part,
  csrf,
  quickAdd,
}: {
  part: Part;
  csrf?: string;
  quickAdd: boolean;
}) {
  const tone = stockTone(part.stockQty, part.reorderPoint);
  const out = tone === "out";
  return (
    <article className="led-row">
      <span className="led-thumb">
        <PartMedia category={part.category} artKey={part.art} seed={part.sku} size="sm" alt={part.title} />
      </span>
      <div className="led-main">
        <h3 className="led-title">
          <Link href={`/parts/item/${part.id}`} prefetch={false}>
            {part.title}
          </Link>
        </h3>
        <p className="led-meta">
          <span className="led-ref">{part.sku}</span>
          {part.brand ? <span>{part.brand}</span> : null}
          <span>Pack {part.packSize}</span>
          {part.demo ? <span>Demo price</span> : null}
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
          <Link href={`/parts/item/${part.id}`} className="btn btn-ghost btn-small" prefetch={false}>
            {out ? "Lead time" : "View"}
          </Link>
        )}
      </div>
    </article>
  );
});
