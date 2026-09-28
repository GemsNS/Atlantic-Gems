import Link from "next/link";
import { preload } from "react-dom";
import { SiteNav } from "@/components/SiteNav";
import { collectionIsPublic } from "@/lib/inventory/types";
import { getSettings } from "@/lib/inventory/store";
import { getCart, resolveCart } from "@/lib/cart";
import { listParts } from "@/lib/parts/store";
import { enabledServices } from "@/lib/site-pages";
import { site } from "@/lib/site";
import { imageProps } from "@/lib/image-props";
import mark from "@/public/brand/mark.jpg";

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

export async function SiteHeader() {
  const settings = await getSettings().catch(() => null);
  const pages = settings?.pages ?? {
    jewellery: false,
    custom: false,
    repair: false,
    setting: false,
    appraisals: false,
    watches: false,
    gemstones: false,
    collection: false,
    parts: true,
    wholesale: true,
  };
  const links: { href: string; label: string }[] = [];
  for (const s of enabledServices(pages)) {
    links.push({ href: s.href, label: s.navLabel });
  }
  if (settings && collectionIsPublic(settings)) {
    links.splice(Math.min(1, links.length), 0, { href: "/inventory", label: "Collection" });
  }
  if (pages.parts) {
    links.unshift({ href: "/parts", label: "Parts" });
  }
  if (pages.wholesale) {
    links.push({ href: "/wholesale", label: "Trade" });
  }

  let cartCount = 0;
  if (pages.parts) {
    try {
      const lines = await getCart();
      // Only lines that can still be quoted; withdrawn ones are flagged on /cart.
      if (lines.length > 0) {
        const { rows } = resolveCart(lines, await listParts());
        cartCount = rows.reduce((n, r) => n + r.line.qty, 0);
      }
    } catch {
      cartCount = 0;
    }
  }

  // A plain <img> with next/image's own props, so no image component ships to
  // the browser (plan item U11). The preload is what `priority` used to emit.
  const markImg = imageProps({ src: mark, alt: "", width: 40, height: 40, priority: true });
  preload(markImg.src, { as: "image", imageSrcSet: markImg.srcSet, imageSizes: markImg.sizes });

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- props from next/image's getImgProps */}
          <img {...markImg} alt="" className="brand-mark" />
          <span>{site.name}</span>
        </Link>
        <SiteNav
          links={[
            ...links,
            ...(pages.parts && !IS_STATIC
              ? [{ href: "/cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart" }]
              : []),
          ]}
        />
      </div>
    </header>
  );
}
