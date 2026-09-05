import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "Repair & Restoration",
  description:
    "Fine jewellery repair and restoration in Halifax, Nova Scotia, with documented intake and written estimates.",
};

export default function RepairPage() {
  return (
    <ServicePage
      serviceKey="repair"
      intro={
        <>
          <p>
            Worn, damaged or inherited pieces are assessed at the bench and returned to you with a
            written estimate before any work begins. Each item is described and photographed at
            intake so its condition is on record.
          </p>
          <p>
            We will tell you when a repair is not worth the cost, or when a piece should be left
            as it is.
          </p>
        </>
      }
      process={[
        {
          title: "Intake",
          body: "Your piece is described, photographed and given a reference. You receive a copy.",
        },
        {
          title: "Assessment and estimate",
          body: "We assess the work required and send a written estimate for your authorization.",
        },
        {
          title: "Work and return",
          body: "Work proceeds only once you approve. The piece is inspected and returned in the condition agreed.",
        },
      ]}
      aside={
        <>
          <h3>Items in our care</h3>
          <p>
            Pieces left with us are held securely and released only to the person named at
            intake or someone they authorize in writing.
          </p>
        </>
      }
    />
  );
}
