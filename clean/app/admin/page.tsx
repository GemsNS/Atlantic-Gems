import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, listItems } from "@/lib/inventory/store";
import { ebayConfigured } from "@/lib/inventory/ebay";
import { categoryLabel, conditionLabel, formatPrice, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Inventory admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPage({
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
  };

  return (
    <AdminShell csrf={csrf} title="Inventory" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        <div className="aside-card">
          <h3>Shop status</h3>
          <p>
            {settings.shopOpen ? (
              <>
                <strong>Open.</strong> Public items are visible on the collection page.
              </>
            ) : (
              <>
                <strong>Closed.</strong> The collection page is hidden from visitors. Trade-only items
                remain visible in the gated trade area.
              </>
            )}
          </p>
          <form action="/api/admin/settings" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="shopOpen" value={settings.shopOpen ? "closed" : "open"} />
            <button className={`btn ${settings.shopOpen ? "btn-ghost" : "btn-primary"}`} type="submit">
              {settings.shopOpen ? "Close the shop" : "Open the shop"}
            </button>
          </form>
        </div>

        <div className="aside-card">
          <h3>eBay import</h3>
          {ebayConfigured() ? (
            <>
              <p>
                Pulls your active eBay listings into the inventory. Ended listings are marked sold.
                {settings.ebayLastImport ? (
                  <>
                    <br />
                    Last import {new Date(settings.ebayLastImport).toLocaleString("en-CA")}: {settings.ebayLastResult}
                  </>
                ) : null}
              </p>
              <form action="/api/admin/ebay-import" method="post">
                <input type="hidden" name="csrf" value={csrf} />
                <button className="btn btn-primary" type="submit">
                  Import from eBay now
                </button>
              </form>
            </>
          ) : (
            <p>
              Not configured. Add EBAY_CLIENT_ID, EBAY_CLIENT_SECRET and EBAY_SELLER_USERNAME to the
              server environment to enable one-click import of your listings.
            </p>
          )}
        </div>

        <div className="aside-card">
          <h3>Counts</h3>
          <ul className="facts" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
            <li><span className="k">Public</span><span className="v">{counts.public}</span></li>
            <li><span className="k">Trade only</span><span className="v">{counts.trade}</span></li>
            <li><span className="k">Private</span><span className="v">{counts.private}</span></li>
            <li><span className="k">Sold</span><span className="v">{counts.sold}</span></li>
          </ul>
        </div>
      </div>

      <div className="admin-tablewrap">
        {items.length === 0 ? (
          <div className="empty">
            <p>No items yet.</p>
            <Link href="/admin/items/new" className="btn btn-primary">
              Add the first item
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Source</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="table-item">
                      {i.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.images[0]} alt="" />
                      ) : (
                        <span className="table-noimg" aria-hidden="true" />
                      )}
                      <div>
                        <Link href={`/admin/items/${i.id}`}>{i.title}</Link>
                        {i.sku ? <div className="muted" style={{ fontSize: "0.8rem" }}>{i.sku}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td>{categoryLabel(i.category)}</td>
                  <td>{conditionLabel(i.condition)}</td>
                  <td>{formatPrice(i)}</td>
                  <td><span className={`badge badge-${i.status}`}>{statusLabel(i.status)}</span></td>
                  <td><span className={`badge badge-${i.visibility}`}>{i.visibility}</span></td>
                  <td>{i.source}</td>
                  <td>
                    <form action="/api/admin/items/delete" method="post" className="inline-form">
                      <input type="hidden" name="csrf" value={csrf} />
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-ghost btn-small btn-danger" type="submit">
                        Delete
                      </button>
                    </form>
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
