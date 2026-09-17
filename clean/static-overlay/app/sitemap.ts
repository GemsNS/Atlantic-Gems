import type { MetadataRoute } from "next";
import { services, site } from "@/lib/site";

export const dynamic = "force-static";

/** Static Pages preview: list public marketing routes only. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, priority: 1 },
    { url: `${site.url}/parts`, lastModified: now, priority: 0.85 },
    ...services.map((s) => ({ url: `${site.url}${s.href}`, lastModified: now, priority: 0.8 })),
    { url: `${site.url}/contact`, lastModified: now, priority: 0.7 },
    { url: `${site.url}/policies/disclosure`, lastModified: now, priority: 0.5 },
    { url: `${site.url}/policies/wholesale-terms`, lastModified: now, priority: 0.5 },
    { url: `${site.url}/privacy`, lastModified: now, priority: 0.3 },
  ];
}
