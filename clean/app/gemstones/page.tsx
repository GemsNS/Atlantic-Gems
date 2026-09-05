import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { GemExplorer } from "@/components/GemExplorer";

export const metadata: Metadata = {
  title: "Gemstones",
  description:
    "Loose rough and faceted rubies, sapphires, emeralds, diamonds and related stones for private clients and the trade, from Halifax, Nova Scotia.",
};

export default function GemstonesPage() {
  return (
    <>
      <ServicePage
        serviceKey="gemstones"
        intro={
          <>
            <p>
              We supply loose gemstones in rough and faceted form: rubies, sapphires, emeralds,
              diamonds and related stones. Private clients can select a stone for a commission or
              a remount; trade buyers can enquire about parcels and pricing.
            </p>
            <p>
              If we do not have the stone you need, we procure it. Tell us the type, colour, size
              and budget and we source to that brief, confirming the disclosure details before
              you commit.
            </p>
            <p>
              Every stone is quoted individually. When we quote, we state what we know about
              treatment, origin and any accompanying report, and we say plainly when something
              is not known. See our Certification &amp; Disclosure Policy for exactly how.
            </p>
          </>
        }
        process={[
          {
            title: "Tell us what you are looking for",
            body: "Type, colour, size range, budget and whether the stone is for setting, resale or collection.",
          },
          {
            title: "We confirm availability",
            body: "We reply with what we can offer, including form (rough or faceted) and disclosure details.",
          },
          {
            title: "View and decide",
            body: "Private viewing by appointment in Halifax, or trade access for buyers we work with.",
          },
        ]}
      />
      <section className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Categories</p>
            <h2 className="section-title">How we describe each stone.</h2>
          </div>
          <GemExplorer />
        </div>
      </section>
    </>
  );
}
