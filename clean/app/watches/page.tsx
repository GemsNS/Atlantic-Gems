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
            We welcome enquiries for the sale and servicing of fine timepieces. Because scope
            varies by brand and by movement, we confirm what we can take on for each request
            rather than publishing a general list.
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
