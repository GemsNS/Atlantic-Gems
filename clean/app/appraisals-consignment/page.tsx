import type { Metadata } from "next";
import Link from "next/link";
import { ServicePage } from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "Appraisals & Consignment",
  description:
    "Written appraisals of jewellery, gemstones and watches, and consignment sale under a written agreement, in Halifax, Nova Scotia.",
};

export default function AppraisalsPage() {
  return (
    <ServicePage
      serviceKey="appraisals"
      intro={
        <>
          <p>
            An appraisal from us is a written opinion of value for a stated purpose on a stated
            date. It describes the item, sets out the basis of the valuation, and is signed. It
            is not an offer to buy and not a promise of any future sale price.
          </p>
          <p>
            If you would rather sell a piece than keep it, we can offer it for sale on
            consignment. Nothing is listed until a written agreement records the item, its
            condition, the reserve price, our commission and the settlement terms.
          </p>
        </>
      }
      process={[
        {
          title: "Bring the item",
          body: "By appointment. The item is described and photographed at intake and you receive a copy.",
        },
        {
          title: "Appraisal or agreement",
          body: "For an appraisal, we examine the item and issue the written document. For consignment, we agree the reserve and terms in writing first.",
        },
        {
          title: "Document or settlement",
          body: "You receive the signed appraisal, or, once a consigned item sells, settlement within the period stated in the agreement.",
        },
      ]}
      aside={
        <>
          <h3>How we describe items</h3>
          <p>
            Every appraisal and every consigned item follows our{" "}
            <Link href="/policies/disclosure" className="link">
              Certification &amp; Disclosure Policy
            </Link>
            . Consignment terms are set out in our{" "}
            <Link href="/policies/wholesale-terms" className="link">
              trade terms
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
