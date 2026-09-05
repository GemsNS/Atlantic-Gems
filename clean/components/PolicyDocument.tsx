import { site } from "@/lib/site";

export interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export interface Policy {
  slug: string;
  title: string;
  summary: string;
  sections: PolicySection[];
}

export function PolicyDocument({ policy, eyebrow }: { policy: Policy; eyebrow: string }) {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{policy.title}</h1>
          <p className="lede">{policy.summary}</p>
          <p className="muted" style={{ marginTop: 18, fontSize: "0.9rem" }}>
            {site.legalName} (Registration No. {site.registrationNumber}). Effective{" "}
            {site.policiesEffective}.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="prose">
          {policy.sections.map((s) => (
            <div key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ))}
          </div>
        </div>
      </section>
    </>
  );
}
