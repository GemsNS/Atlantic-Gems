import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** STATIC EXPORT: preview host is not for indexing until the real domain points here. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
