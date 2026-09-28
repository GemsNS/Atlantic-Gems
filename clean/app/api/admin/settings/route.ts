import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { updateSettings } from "@/lib/inventory/store";
import { PAGE_KEYS, type PageKey, type SiteMode } from "@/lib/site-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/site", { error: "rejected" });

  const intent = String(form.get("intent") ?? "shop");

  if (intent === "shop") {
    const shopOpen = form.get("shopOpen") === "open";
    await updateSettings({ shopOpen });
    return adminRedirect("/admin/jewellery", { msg: shopOpen ? "shop-open" : "shop-closed" });
  }

  if (intent === "mode") {
    const mode = String(form.get("siteMode") ?? "custom") as SiteMode;
    if (!["parts-supplier", "atelier", "full-house", "custom"].includes(mode)) {
      return adminRedirect("/admin/site", { error: "unknown-mode" });
    }
    if (mode === "custom") {
      return adminRedirect("/admin/site", { msg: "use-toggles" });
    }
    await updateSettings({ siteMode: mode });
    return adminRedirect("/admin/site", { msg: `mode-set:${mode}` });
  }

  if (intent === "pages") {
    const pages: Partial<Record<PageKey, boolean>> = {};
    for (const key of PAGE_KEYS) {
      pages[key] = form.get(`page_${key}`) === "on";
    }
    await updateSettings({ pages, siteMode: "custom" });
    return adminRedirect("/admin/site", { msg: "pages-updated" });
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
    return adminRedirect("/admin/connect", { msg: "ebay-saved" });
  }

  return adminRedirect("/admin/site", { error: "unknown-action" });
}
