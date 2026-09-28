import { QUOTE_STATUSES } from "@/lib/crm/types";
import { itemSchema } from "@/lib/inventory/types";
import type { SiteMode } from "@/lib/site-pages";

/**
 * The status and alert lines an admin action can send back with its redirect.
 * The URL carries only a code, optionally with one argument after a colon
 * (`status-set:sent`, `retired:4`); the words are fixed here, and an argument
 * is used only after it is checked (a known quote status, a site mode, a whole
 * number, an item field). An unknown code shows nothing, so a crafted link
 * cannot put its own text in the admin's status or alert box.
 */
const MESSAGES = {
  "stage-updated": "Stage updated.",
  "no-tasks": "No new tasks.",
  "task-done": "Task marked done.",
  "item-deleted": "Item deleted.",
  "item-updated": "Item updated.",
  "item-added": "Item added.",
  "no-demo": "There are no demo lines to retire.",
  "shop-open": "Shop is now OPEN: public items are visible.",
  "shop-closed": "Shop is now CLOSED: collection hidden.",
  "use-toggles": "Use the page toggles for a custom mix.",
  "pages-updated": "Page visibility updated.",
  "ebay-saved": "eBay store settings saved.",
} as const;

const ERRORS = {
  rejected: "Request rejected. Please try again.",
  "invalid-stage": "Invalid stage.",
  "deal-not-found": "Deal not found.",
  "quote-not-found": "Quote not found.",
  "invalid-status": "Invalid status.",
  "quotes-store": "The quotes file could not be updated. Nothing was changed; try again.",
  "task-not-found": "Task not found.",
  "ebay-unconfigured": "eBay is not configured on this server.",
  "ebay-failed": "eBay sync failed. The server log has the reason ([ebay] lines).",
  "invalid-item": "Invalid item.",
  "item-not-found": "Item not found.",
  "price-nan": "Price must be a number.",
  "confirm-retire": "Tick the confirmation box to retire the demo lines.",
  "retire-failed": "The parts file could not be updated. No demo lines were retired.",
  "unknown-mode": "Unknown mode.",
  "unknown-action": "Unknown settings action.",
} as const;

const SITE_MODES: readonly SiteMode[] = ["parts-supplier", "atelier", "full-house", "custom"];
const ITEM_FIELDS = new Set(Object.keys(itemSchema.shape));

type QuoteStatus = (typeof QUOTE_STATUSES)[number]["value"];

export type AdminMsg =
  | keyof typeof MESSAGES
  | `status-set:${QuoteStatus}`
  | `tasks-created:${number}`
  | `ebay-synced:${number}.${number}.${number}`
  | `retired:${number}`
  | `mode-set:${SiteMode}`;

export type AdminError =
  | keyof typeof ERRORS
  | `item-invalid:${string}`
  | `retire-partial:${number}`;

const demoLines = (n: number) => `${n} demo ${n === 1 ? "line" : "lines"}`;

/** A small whole number from the URL, or null. */
function count(raw: string): number | null {
  return /^\d{1,6}$/.test(raw) ? Number(raw) : null;
}

function split(code: string): [string, string] {
  const i = code.indexOf(":");
  return i < 0 ? [code, ""] : [code.slice(0, i), code.slice(i + 1)];
}

/** The status line for a `?msg=` code, or undefined for anything unknown. */
export function adminMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (Object.hasOwn(MESSAGES, code)) return MESSAGES[code as keyof typeof MESSAGES];
  const [key, arg] = split(code);
  switch (key) {
    case "status-set": {
      const status = QUOTE_STATUSES.find((s) => s.value === arg);
      return status ? `Status set to ${status.label}.` : undefined;
    }
    case "tasks-created": {
      const n = count(arg);
      return n === null ? undefined : `Created ${n} new ${n === 1 ? "task" : "tasks"}.`;
    }
    case "ebay-synced": {
      const m = /^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/.exec(arg);
      return m ? `eBay sync complete: ${m[1]} active, ${m[2]} marked sold, ${m[3]} skipped.` : undefined;
    }
    case "retired": {
      const n = count(arg);
      return n === null ? undefined : `Retired ${demoLines(n)}.`;
    }
    case "mode-set":
      return SITE_MODES.includes(arg as SiteMode) ? `Site mode set to ${arg}.` : undefined;
    default:
      return undefined;
  }
}

/** The alert line for a `?error=` code, or undefined for anything unknown. */
export function adminError(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (Object.hasOwn(ERRORS, code)) return ERRORS[code as keyof typeof ERRORS];
  const [key, arg] = split(code);
  switch (key) {
    case "item-invalid":
      return ITEM_FIELDS.has(arg) ? `Check the ${arg} field.` : ERRORS["invalid-item"];
    case "retire-partial": {
      const n = count(arg);
      return n === null
        ? undefined
        : `Retired ${demoLines(n)}, then the parts file could not be updated. Try again to retire the rest.`;
    }
    default:
      return undefined;
  }
}
