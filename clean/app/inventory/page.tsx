import type { Metadata } from "next";
import Link from "next/link";
import { InventoryBrowser } from "@/components/InventoryBrowser";
import { getSettings, listItems } from "@/lib/inventory/store";
import { isVisibleToPublic } from "@/lib/inventory/types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "The Collection",
    description: "New and pre-owned fine jewellery and watches available from Atlantic Gems in Halifax.",
    robots: settings.shopOpen ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function InventoryPage() {
  const settings = await getSettings();

  if (!settings.shopOpen) {
    return (
      <>
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">The collection</p>
            <h1>Being prepared</h1>
            <p className="lede">
              Our online collection is not open yet. Pieces are shown by appointment, and we source to
              your brief in the meantime.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="wrap">
            <div className="empty">
              <p>Tell us what you are looking for and we will reply with what we have or can source.</p>
              <Link href="/contact?type=jewellery" className="btn btn-primary">
                Ask about current pieces
              </Link>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                Or email <a href={`mailto:${site.email}`} className="link">{site.email}</a>
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const items = (await listItems()).filter((i) => isVisibleToPublic(i) && i.status !== "sold");

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">The collection</p>
          <h1>New and pre-owned</h1>
          <p className="lede">
            Every piece is described under our disclosure policy: metal as stamped or tested, stones as
            measured, treatments and reports stated. Prices in Canadian dollars unless marked.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <InventoryBrowser items={items} />
        </div>
      </section>
    </>
  );
}
