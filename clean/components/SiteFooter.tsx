import Image from "next/image";
import Link from "next/link";
import { services, site } from "@/lib/site";
import mark from "@/public/brand/mark.jpg";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <Image src={mark} alt="" className="brand-mark" width={40} height={40} />
              <span>{site.name}</span>
            </div>
            <p>{site.tagline}</p>
            <p style={{ marginTop: 10 }}>
              {site.city}, {site.region}, {site.country}
              <br />
              {site.locationNote}
            </p>
          </div>
          <div>
            <h4>The house</h4>
            <ul>
              {services.map((s) => (
                <li key={s.key}>
                  <Link href={s.href}>{s.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Enquiries</h4>
            <ul>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              {site.phone ? (
                <li>
                  <a href={`tel:${site.phone}`}>{site.phone}</a>
                </li>
              ) : null}
              <li>
                <Link href="/contact">Private appointment</Link>
              </li>
              <li>
                <Link href="/wholesale">Trade access</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li>
                <a href={site.social.instagram.url} rel="noopener noreferrer" target="_blank">
                  Instagram {site.social.instagram.handle}
                </a>
              </li>
              <li>
                <a href={site.social.facebook.url} rel="noopener noreferrer" target="_blank">
                  {site.social.facebook.label}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {site.name} ({site.legalName}, Registration No. {site.registrationNumber}).
            All rights reserved.
          </span>
          <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/policies/disclosure">Disclosure policy</Link>
            <Link href="/policies/wholesale-terms">Trade terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
