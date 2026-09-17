import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { collectionIsPublic } from "@/lib/inventory/types";
import { getSettings } from "@/lib/inventory/store";
import { getCart } from "@/lib/cart";
import { enabledServices } from "@/lib/site-pages";
import { site } from "@/lib/site";
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
      const cart = await getCart();
      cartCount = cart.reduce((n, l) => n + l.qty, 0);
    } catch {
      cartCount = 0;
    }
  }

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          <Image src={mark} alt="" className="brand-mark" width={40} height={40} priority />
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
