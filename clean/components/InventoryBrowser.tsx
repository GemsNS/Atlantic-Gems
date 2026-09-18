"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { SaveButton } from "@/components/inventory/SaveButton";
import { clearSaved, useSavedPieces } from "@/components/inventory/saved-store";
import {
  ArrowRight,
  GemOutline,
  GridIcon,
  ListIcon,
  NoResultIcon,
  SearchIcon,
  SlidersIcon,
} from "@/components/shop/Icons";
import { CATEGORIES, CONDITIONS, type InventoryItem } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice } from "@/lib/format";
import {
  PRICE_BANDS,
  inBand,
  isNewArrival,
  metalFamilies,
  metalFamily,
  savedBrief,
  searchText,
} from "@/lib/inventory/facets";

type Sort = "newest" | "price-asc" | "price-desc" | "title";
type View = "gallery" | "ledger";
type Facet = "q" | "category" | "condition" | "metal" | "band" | "available" | "saved";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "title", label: "Title, A to Z" },
];

export function InventoryBrowser({
  items,
  hrefBase = "/inventory",
  contactType = "jewellery",
}: {
  items: InventoryItem[];
  hrefBase?: string;
  /** Feeds the contact form so an enquiry lands in the right queue. */
  contactType?: "jewellery" | "wholesale";
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [metal, setMetal] = useState("all");
  const [band, setBand] = useState("all");
  const [available, setAvailable] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<View>("gallery");
  const [railOpen, setRailOpen] = useState(false);
  const saved = useSavedPieces();
  const searchRef = useRef<HTMLInputElement | null>(null);

  // "/" jumps to the search box the way a catalogue index would.
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
  const savedSet = useMemo(() => new Set(saved), [saved]);

  const tests = useMemo(() => {
    const bandDef = PRICE_BANDS.find((b) => b.value === band);
    return {
      q: (i: InventoryItem) => !needle || searchText(i).includes(needle),
      category: (i: InventoryItem) => category === "all" || i.category === category,
      condition: (i: InventoryItem) => condition === "all" || i.condition === condition,
      metal: (i: InventoryItem) => metal === "all" || metalFamily(i) === metal,
      band: (i: InventoryItem) => !bandDef || inBand(i, bandDef),
      available: (i: InventoryItem) => !available || i.status === "available",
      saved: (i: InventoryItem) => !onlySaved || savedSet.has(i.id),
    } satisfies Record<Facet, (i: InventoryItem) => boolean>;
  }, [needle, category, condition, metal, band, available, onlySaved, savedSet]);

  /** Passes every filter except the one being counted, so counts stay live. */
  const passes = useMemo(() => {
    const keys = Object.keys(tests) as Facet[];
    return (i: InventoryItem, skip?: Facet) => keys.every((k) => k === skip || tests[k](i));
  }, [tests]);

  const shown = useMemo(() => {
    const list = items.filter((i) => passes(i));
    const price = (i: InventoryItem) => (i.price === null ? Number.POSITIVE_INFINITY : i.price);
    const added = (i: InventoryItem) => Date.parse(i.createdAt) || 0;
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") list.sort((a, b) => price(b) - price(a));
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => added(b) - added(a));
    return list;
  }, [items, passes, sort]);

  const countIf = (skip: Facet, match: (i: InventoryItem) => boolean) =>
    items.filter((i) => passes(i, skip) && match(i)).length;

  const cats = useMemo(
    () => CATEGORIES.filter((c) => items.some((i) => i.category === c.value)),
    [items],
  );
  const metals = useMemo(() => metalFamilies(items), [items]);
  const bands = useMemo(() => PRICE_BANDS.filter((b) => items.some((i) => inBand(i, b))), [items]);

  const savedItems = useMemo(() => items.filter((i) => savedSet.has(i.id)), [items, savedSet]);

  const applied: { key: string; label: string; clear: () => void }[] = [];
  if (category !== "all")
    applied.push({ key: "c", label: categoryLabel(category), clear: () => setCategory("all") });
  if (condition !== "all")
    applied.push({ key: "n", label: conditionLabel(condition), clear: () => setCondition("all") });
  if (metal !== "all") {
    const m = metals.find((x) => x.value === metal);
    applied.push({ key: "m", label: m?.label ?? "Metal", clear: () => setMetal("all") });
  }
  if (band !== "all") {
    const b = PRICE_BANDS.find((x) => x.value === band);
    applied.push({ key: "b", label: b?.label ?? "Price", clear: () => setBand("all") });
  }
  if (available) applied.push({ key: "a", label: "Available only", clear: () => setAvailable(false) });
  if (onlySaved) applied.push({ key: "s", label: "Saved only", clear: () => setOnlySaved(false) });
  if (needle) applied.push({ key: "q", label: `“${q.trim()}”`, clear: () => setQ("") });

  const resetAll = () => {
    setQ("");
    setCategory("all");
    setCondition("all");
    setMetal("all");
    setBand("all");
    setAvailable(false);
    setOnlySaved(false);
  };

  // Re-mounting on a facet change replays the settle animation; typing in the
  // search box deliberately does not, so results do not flicker per keystroke.
  const settleKey = `${category}|${condition}|${metal}|${band}|${sort}|${view}|${available}|${onlySaved}`;

  const brief = savedItems.length ? savedBrief(savedItems) : "";

  return (
    <div className="browse">
      <button
        type="button"
        className="rail-toggle"
        aria-expanded={railOpen}
        aria-controls="collection-rail"
        onClick={() => setRailOpen((o) => !o)}
      >
        <SlidersIcon />
        {railOpen ? "Hide filters" : "Filters"}
        {applied.length ? <span className="chip-n">{applied.length}</span> : null}
      </button>

      <aside
        className="browse-rail"
        id="collection-rail"
        data-open={railOpen ? "true" : "false"}
        aria-label="Filter the collection"
      >
        {cats.length > 1 ? (
          <div className="rail-group">
            <p className="rail-title">Category</p>
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
                    <span className="chip-n">{countIf("category", (i) => i.category === c.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {bands.length > 1 ? (
          <div className="rail-group">
            <p className="rail-title">Price</p>
            <ul className="rail-list">
              {bands.map((b) => (
                <li key={b.value}>
                  <button
                    type="button"
                    aria-pressed={band === b.value}
                    onClick={() => setBand(band === b.value ? "all" : b.value)}
                  >
                    {b.label}
                    <span className="chip-n">{countIf("band", (i) => inBand(i, b))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {metals.length > 1 ? (
          <div className="rail-group">
            <p className="rail-title">Metal</p>
            <ul className="rail-list">
              {metals.map((m) => (
                <li key={m.value}>
                  <button
                    type="button"
                    aria-pressed={metal === m.value}
                    onClick={() => setMetal(metal === m.value ? "all" : m.value)}
                  >
                    {m.label}
                    <span className="chip-n">{countIf("metal", (i) => metalFamily(i) === m.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rail-group">
          <p className="rail-title">Show</p>
          <label className="rail-switch">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            Available only
          </label>
          <label className="rail-switch">
            <input
              type="checkbox"
              checked={onlySaved}
              onChange={(e) => setOnlySaved(e.target.checked)}
              disabled={savedItems.length === 0}
            />
            Saved pieces {savedItems.length ? `(${savedItems.length})` : ""}
          </label>
        </div>

        <p className="rail-note">
          Nothing here is a stock photograph. If a piece is not shown, ask — most of what we place is
          sourced to a brief.
        </p>
      </aside>

      <div>
        <div className="filters">
          <div className="filters-bar">
            <div className="search">
              <SearchIcon className="search-icon" />
              <label className="sr-only" htmlFor="collection-search">
                Search the collection
              </label>
              <input
                id="collection-search"
                ref={searchRef}
                type="search"
                placeholder="Search title, metal, stone or reference"
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
              <label className="sr-only" htmlFor="collection-sort">
                Sort
              </label>
              <select id="collection-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="viewtoggle" role="group" aria-label="Layout">
              <button type="button" aria-pressed={view === "gallery"} onClick={() => setView("gallery")}>
                <GridIcon />
                Plates
              </button>
              <button type="button" aria-pressed={view === "ledger"} onClick={() => setView("ledger")}>
                <ListIcon />
                Ledger
              </button>
            </div>
          </div>

          {CONDITIONS.length > 1 ? (
            <ul className="chipset">
              <li>
                <button type="button" className="chip" aria-pressed={condition === "all"} onClick={() => setCondition("all")}>
                  New and pre-owned
                </button>
              </li>
              {CONDITIONS.map((c) => (
                <li key={c.value}>
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={condition === c.value}
                    onClick={() => setCondition(condition === c.value ? "all" : c.value)}
                  >
                    {c.label}
                    <span className="chip-n">{countIf("condition", (i) => i.condition === c.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

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
            <strong>{shown.length}</strong> {shown.length === 1 ? "piece" : "pieces"}
            {shown.length !== items.length ? ` of ${items.length}` : ""}
          </span>
          <span>{view === "ledger" ? "Ledger view" : "Plate view"}</span>
        </p>

        {shown.length === 0 ? (
          <div className="empty-state">
            <NoResultIcon />
            <h3>{items.length === 0 ? "Nothing published yet" : "No piece matches that"}</h3>
            <p>
              {items.length === 0
                ? "Pieces are added as they are photographed and described. Tell us what you are looking for in the meantime."
                : "Try a wider price band, or drop a filter. We can also source to a brief."}
            </p>
            <div className="empty-actions">
              {applied.length ? (
                <button type="button" className="btn btn-ghost" onClick={resetAll}>
                  Clear filters
                </button>
              ) : null}
              <Link href={`/contact?type=${contactType}`} className="btn btn-primary">
                Ask us to source it
              </Link>
            </div>
          </div>
        ) : view === "gallery" ? (
          <div className="inv-grid is-settling" key={settleKey}>
            {shown.map((i) => (
              <ItemCard key={i.id} item={i} hrefBase={hrefBase} />
            ))}
          </div>
        ) : (
          <div className="inv-ledger is-settling" key={settleKey}>
            {shown.map((i) => (
              <LedgerRow key={i.id} item={i} hrefBase={hrefBase} />
            ))}
          </div>
        )}

        {savedItems.length > 0 ? (
          <div className="saved-bar">
            <p>
              <strong>{savedItems.length}</strong>
              {savedItems.length === 1 ? "piece saved for enquiry" : "pieces saved for enquiry"}
            </p>
            <span className="saved-bar-actions">
              <button type="button" className="btn btn-ghost btn-small" onClick={clearSaved}>
                Clear
              </button>
              <Link
                href={`/contact?type=${contactType}&brief=${encodeURIComponent(brief)}`}
                className="btn btn-primary btn-small"
              >
                Enquire about these
                <ArrowRight />
              </Link>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LedgerRow({ item, hrefBase }: { item: InventoryItem; hrefBase: string }) {
  const img = item.images[0];
  const spec = [item.metal, item.stones, item.size].filter(Boolean).join(" · ");
  return (
    <article className="led-row">
      <span className="led-thumb">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" />
        ) : (
          <GemOutline className="search-icon" />
        )}
      </span>
      <div className="led-main">
        <h3 className="led-title">
          <Link href={`${hrefBase}/${item.id}`}>{item.title}</Link>
        </h3>
        <p className="led-meta">
          <span>{categoryLabel(item.category)}</span>
          <span>{conditionLabel(item.condition)}</span>
          {spec ? <span>{spec}</span> : null}
          {item.sku ? <span className="led-ref">{item.sku}</span> : null}
          {item.status === "reserved" ? <span className="flag flag-reserved">Reserved</span> : null}
          {isNewArrival(item) && item.status !== "reserved" ? (
            <span className="flag flag-new">Just in</span>
          ) : null}
        </p>
      </div>
      <p className={`led-price${item.price === null ? " is-poa" : ""}`}>{formatPrice(item)}</p>
      <div className="led-actions">
        <SaveButton id={item.id} title={item.title} />
      </div>
    </article>
  );
}
