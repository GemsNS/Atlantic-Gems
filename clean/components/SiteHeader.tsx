import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getSettings } from "@/lib/inventory/store";
import { services, site } from "@/lib/site";
import mark from "@/public/brand/mark.jpg";

export async function SiteHeader() {
  const settings = await getSettings().catch(() => ({ shopOpen: false }));
  const links = [
    ...services.map((s) => ({ href: s.href, label: s.navLabel })),
    { href: "/wholesale", label: "Trade" },
  ];
  if (settings.shopOpen) links.splice(1, 0, { href: "/inventory", label: "Collection" });

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          <Image src={mark} alt="" className="brand-mark" width={40} height={40} priority />
          <span>{site.name}</span>
        </Link>
        <SiteNav links={links} />
      </div>
    </header>
  );
}
