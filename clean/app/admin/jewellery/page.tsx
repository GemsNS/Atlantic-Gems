import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, listItems } from "@/lib/inventory/store";
import { ebayConfigured } from "@/lib/inventory/ebay";
import { categoryLabel, formatPrice, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Jewellery inventory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminJewelleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const [settings, items] = await Promise.all([getSettings(), listItems()]);
  const counts = {
    public: items.filter((i) => i.visibility === "public" && i.status !== "sold").length,
    trade: items.filter((i) => i.visibility === "trade").length,
    private: items.filter((i) => i.visibility === "private").length,
    sold: items.filter((i) => i.status === "sold").length,
    ebay: items.filter((i) => i.source === "ebay").length,
  };

  return (
    <AdminShell csrf={csrf} title="Jewellery inventory" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        <div className="aside-card">
          <h3>Public collection shop</h3>
          <p>
            Page enabled: <strong>{settings.pages.collection ? "yes" : "no"}</strong>.{" "}
            {settings.shopOpen ? (
              <>
                <strong>Open.</strong> Public items are visible when the collection page is on.
              </>
            ) : (
              <>
                <strong>Closed.</strong> Collection shows “being prepared” when the page is on.
              </>
            )}
          </p>
          <form action="/api/admin/settings" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="intent" value="shop" />
            <input type="hidden" name="shopOpen" value={settings.shopOpen ? "closed" : "open"} />
            <button className={`btn ${settings.shopOpen ? "btn-ghost" : "btn-primary"}`} type="submit">
              {settings.shopOpen ? "Close the shop" : "Open the shop"}
            </button>
          </form>
        </div>

        <div className="aside-card">
          <h3>eBay</h3>
          <p>
            {ebayConfigured()
              ? settings.ebay.lastResult
                ? `Last: ${settings.ebay.lastResult}`
                : "Credentials present. Sync from Connect."
              : "Not configured. Use Connect to set seller and env keys."}
          </p>
          <Link href="/admin/connect" className="btn btn-ghost btn-small">
            Connect eBay store
          </Link>
        </div>

        <div className="aside-card">
          <h3>Counts</h3>
          <ul className="facts" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
            <li>
              <span className="k">Public</span>
              <span className="v">{counts.public}</span>
            </li>
            <li>
              <span className="k">Trade only</span>
              <span className="v">{counts.trade}</span>
            </li>
            <li>
              <span className="k">Private</span>
              <span className="v">{counts.private}</span>
            </li>
            <li>
              <span className="k">eBay-sourced</span>
              <span className="v">{counts.ebay}</span>
            </li>
          </ul>
          <Link href="/admin/items/new" className="btn btn-primary btn-small" style={{ marginTop: 12 }}>
            Add item
          </Link>
        </div>
      </div>

      <div className="admin-tablewrap" style={{ marginTop: 28 }}>
        {items.length === 0 ? (
          <div className="empty">
            <p>No jewellery items yet. Add manually or sync an eBay store.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Source</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{i.title}</td>
                  <td>{categoryLabel(i.category)}</td>
                  <td>
                    {statusLabel(i.status)} · {i.visibility}
                  </td>
                  <td>
                    {i.source}
                    {i.ebayUrl ? (
                      <>
                        {" "}
                        <a href={i.ebayUrl} target="_blank" rel="noopener noreferrer" className="link">
                          eBay
                        </a>
                      </>
                    ) : null}
                  </td>
                  <td>{formatPrice(i)}</td>
                  <td>
                    <Link href={`/admin/items/${i.id}`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
