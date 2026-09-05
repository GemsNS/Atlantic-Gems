import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "High-End Watches",
  description:
    "Sales and service enquiries for high-end watches in Halifax, Nova Scotia. Brand coverage confirmed per request.",
};

export default function WatchesPage() {
  return (
    <ServicePage
      serviceKey="watches"
      intro={
        <>
          <p>
            We sell, source and arrange servicing for fine timepieces. Brands and models
            available are subject to current stock, so rather than publish a list that would be
            out of date, we confirm what is on hand when you ask, and we procure specific
            references on request.
          </p>
          <p>
            Tell us the brand, model and reference if you have it, and what you would like
            done. We reply with whether we can help, and with a written quotation where we can.
          </p>
        </>
      }
      process={[
        {
          title: "Enquiry",
          body: "Brand, model, reference and your requirement: purchase, sale or service.",
        },
        {
          title: "Confirmation of scope",
          body: "We confirm whether the request is within what we offer and what it would involve.",
        },
        {
          title: "Written quotation",
          body: "Any work or sale proceeds only on a written quotation you have approved.",
        },
      ]}
      aside={
        <>
          <h3>Authenticity</h3>
          <p>
            We do not make claims about a watch we have not examined. Any statement about
            authenticity, service history or condition is made in writing after inspection.
          </p>
        </>
      }
    />
  );
}
