import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { services, site } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <BrandMark className="brand-mark" />
              <span>{site.name}</span>
            </div>
            <p>{site.tagline}</p>
            <p style={{ marginTop: 10 }}>
              {site.city}, {site.region}, {site.country}
              {site.address ? <br /> : null}
              {site.address}
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
            © {year} {site.name}. All rights reserved.
          </span>
          <span>
            <Link href="/privacy">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
