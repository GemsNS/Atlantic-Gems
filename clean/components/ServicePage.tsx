import Link from "next/link";
import type { ReactNode } from "react";
import { services, type ServiceKey } from "@/lib/site";

interface ServicePageProps {
  serviceKey: ServiceKey;
  intro: ReactNode;
  process?: { title: string; body: string }[];
  aside?: ReactNode;
  children?: ReactNode;
}

export function ServicePage({ serviceKey, intro, process, aside, children }: ServicePageProps) {
  const service = services.find((s) => s.key === serviceKey);
  if (!service) return null;
  const enquiryType = serviceKey === "gemstones" ? "gemstones" : serviceKey;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{service.short}</p>
          <h1>{service.title}</h1>
          <p className="lede">{service.summary}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap two-col">
          <div>
            <h2>What we do</h2>
            <div className="lede" style={{ maxWidth: "none" }}>
              {intro}
            </div>
            {process ? (
              <>
                <h2 style={{ marginTop: 48 }}>How it works</h2>
                <ol className="points" style={{ counterReset: "step" }}>
                  {process.map((p) => (
                    <li key={p.title}>
                      <strong style={{ display: "block", color: "var(--parchment)", marginBottom: 6 }}>
                        {p.title}
                      </strong>
                      {p.body}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
            {children}
          </div>
          <div>
            <ul className="points" aria-label="Key points">
              {service.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="aside-card" style={{ marginTop: 16 }}>
              {aside ?? (
                <>
                  <h3>Start with a conversation</h3>
                  <p>
                    Send a short description of what you need. We reply by email with next steps
                    and, where relevant, a written estimate.
                  </p>
                </>
              )}
              <Link href={`/contact?type=${enquiryType}`} className="btn btn-primary">
                {service.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
