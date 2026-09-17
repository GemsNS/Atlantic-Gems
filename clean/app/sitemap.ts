import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/inventory/store";
import { collectionIsPublic } from "@/lib/inventory/types";
import { enabledServices } from "@/lib/site-pages";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const settings = await getSettings();
  const entries: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, priority: 1 },
    { url: `${site.url}/contact`, lastModified: now, priority: 0.7 },
    { url: `${site.url}/policies/disclosure`, lastModified: now, priority: 0.5 },
    { url: `${site.url}/policies/wholesale-terms`, lastModified: now, priority: 0.5 },
    { url: `${site.url}/privacy`, lastModified: now, priority: 0.3 },
  ];
  for (const s of enabledServices(settings.pages)) {
    entries.push({ url: `${site.url}${s.href}`, lastModified: now, priority: 0.8 });
  }
  if (settings.pages.parts) {
    entries.push({ url: `${site.url}/parts`, lastModified: now, priority: 0.85 });
  }
  if (collectionIsPublic(settings)) {
    entries.push({ url: `${site.url}/inventory`, lastModified: now, priority: 0.75 });
  }
  return entries;
}
