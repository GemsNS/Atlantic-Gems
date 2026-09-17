import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { updateSettings } from "@/lib/inventory/store";
import { PAGE_KEYS, type PageKey, type SiteMode } from "@/lib/site-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin/site", undefined, "Request rejected. Please try again.");

  const intent = String(form.get("intent") ?? "shop");

  if (intent === "shop") {
    const shopOpen = form.get("shopOpen") === "open";
    await updateSettings({ shopOpen });
    return adminRedirect(
      req,
      "/admin/jewellery",
      shopOpen ? "Shop is now OPEN: public items are visible." : "Shop is now CLOSED: collection hidden.",
    );
  }

  if (intent === "mode") {
    const mode = String(form.get("siteMode") ?? "custom") as SiteMode;
    if (!["parts-supplier", "atelier", "full-house", "custom"].includes(mode)) {
      return adminRedirect(req, "/admin/site", undefined, "Unknown mode.");
    }
    if (mode === "custom") {
      return adminRedirect(req, "/admin/site", "Use the page toggles for a custom mix.");
    }
    await updateSettings({ siteMode: mode });
    return adminRedirect(req, "/admin/site", `Site mode set to ${mode}.`);
  }

  if (intent === "pages") {
    const pages: Partial<Record<PageKey, boolean>> = {};
    for (const key of PAGE_KEYS) {
      pages[key] = form.get(`page_${key}`) === "on";
    }
    await updateSettings({ pages, siteMode: "custom" });
    return adminRedirect(req, "/admin/site", "Page visibility updated.");
  }

  if (intent === "ebay") {
    await updateSettings({
      ebay: {
        sellerUsername: String(form.get("sellerUsername") ?? "").trim(),
        storeUrl: String(form.get("storeUrl") ?? "").trim(),
        syncEnabled: form.get("syncEnabled") === "on",
        importToVisibility: (["public", "trade", "private"].includes(String(form.get("importToVisibility")))
          ? String(form.get("importToVisibility"))
          : "public") as "public" | "trade" | "private",
        categories: {
          jewellery: form.get("cat_jewellery") === "on",
          watches: form.get("cat_watches") === "on",
          looseStones: form.get("cat_looseStones") === "on",
        },
      },
    });
    return adminRedirect(req, "/admin/connect", "eBay store settings saved.");
  }

  return adminRedirect(req, "/admin/site", undefined, "Unknown settings action.");
}
