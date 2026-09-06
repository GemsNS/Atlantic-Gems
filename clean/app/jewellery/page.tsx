import type { Metadata } from "next";
import Link from "next/link";
import { ServicePage } from "@/components/ServicePage";
import { SourcingBrief } from "@/components/interactive/SourcingBrief";
import { getSettings } from "@/lib/inventory/store";

export const metadata: Metadata = {
  title: "Jewellery, New and Pre-Owned",
  description:
    "Brand-new and pre-owned fine jewellery, bought, sold and sourced to your brief by Atlantic Gems in Halifax, Nova Scotia.",
};

export default async function JewelleryPage() {
  const settings = await getSettings();
  return (
    <>
      <ServicePage
        serviceKey="jewellery"
        intro={
          <>
            <p>
              We sell fine jewellery in two kinds: brand-new pieces, and pre-owned pieces that have
              been examined at our bench and described exactly as found. Both are shown by
              appointment{settings.shopOpen ? " and in the online collection" : ""}.
            </p>
            <p>
              If the piece you want is not in the collection, we source it. And if you have jewellery
              you no longer wear, we buy it, take it in trade, or sell it for you on consignment.
            </p>
          </>
        }
        process={[
          {
            title: "Tell us the brief",
            body: "The piece, the metal, the budget, and whether new or pre-owned will do.",
          },
          {
            title: "We reply with options",
            body: "What is in the collection now, and what we can source, each with its disclosure details.",
          },
          {
            title: "View, then decide",
            body: "By appointment in Halifax. A written quotation confirms the price before anything changes hands.",
          },
        ]}
        aside={
          <>
            <h3>{settings.shopOpen ? "See the collection" : "The collection"}</h3>
            <p>
              {settings.shopOpen
                ? "Browse what is available now, filtered by piece, condition and price."
                : "The online collection is being prepared. In the meantime, ask and we will send what suits your brief."}
            </p>
            {settings.shopOpen ? (
              <Link href="/inventory" className="btn btn-ghost">
                Browse the collection
              </Link>
            ) : null}
          </>
        }
      />
      <SourcingBrief />
    </>
  );
}
