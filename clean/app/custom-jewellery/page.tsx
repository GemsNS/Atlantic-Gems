import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { CommissionPlanner } from "@/components/interactive/CommissionPlanner";

export const metadata: Metadata = {
  title: "Custom Jewellery",
  description:
    "Custom jewellery designed and fabricated in Halifax, Nova Scotia, working with your own stones or ours.",
};

export default function CustomJewelleryPage() {
  return (
    <>
    <ServicePage
      serviceKey="custom"
      intro={
        <>
          <p>
            A commission begins with a conversation about the piece you have in mind, the stones
            involved and how it will be worn. From there we prepare drawings and a written quote
            before any metal is cut.
          </p>
          <p>
            You may bring your own stones, choose from ours, or combine the two. Existing pieces
            can be remade into something new, and we manufacture small runs for designers and
            retailers who need pieces made to their specification.
          </p>
        </>
      }
      process={[
        {
          title: "Consultation",
          body: "We discuss the brief, stones, metal and budget, in person or by email.",
        },
        {
          title: "Design and quote",
          body: "Drawings and a written quote for your approval. Nothing proceeds until you confirm.",
        },
        {
          title: "Fabrication and setting",
          body: "The piece is made and set at the bench, then inspected before collection.",
        },
      ]}
    />
    <CommissionPlanner />
    </>
  );
}
