import Image from "next/image";
import Link from "next/link";
import { services, site } from "@/lib/site";
import mark from "@/public/brand/mark.jpg";

const links = [
  ...services.map((s) => ({ href: s.href, label: s.navLabel })),
  { href: "/wholesale", label: "Trade" },
];

export function SiteHeader() {
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          <Image src={mark} alt="" className="brand-mark" width={40} height={40} priority />
          <span>{site.name}</span>
        </Link>

        <nav className="nav" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" className="btn btn-primary btn-small nav-cta">
            Enquire
          </Link>
        </nav>

        <details className="nav-mobile">
          <summary aria-label="Open menu">Menu</summary>
          <nav className="nav-mobile-panel" aria-label="Primary mobile">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact">Enquire</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
