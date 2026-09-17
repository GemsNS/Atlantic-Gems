import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings } from "@/lib/inventory/store";
import { ebayConnectionStatus } from "@/lib/integrations/ebay";
import { paymentsConfigured } from "@/lib/integrations/payments";
import { shippingConfigured } from "@/lib/integrations/shipping";
import { accountingConfigured } from "@/lib/integrations/accounting";

export const metadata: Metadata = { title: "Connect", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const settings = await getSettings();
  const ebay = await ebayConnectionStatus();

  return (
    <AdminShell csrf={csrf} title="Connect" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        <div className="aside-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Public eBay store (watches & jewellery)</h3>
          <p>
            Status: <strong>{ebay.status}</strong> — {ebay.message}
          </p>
          <p>
            Syncs active listings into jewellery inventory only — not the parts catalogue. Requires{" "}
            <code>EBAY_CLIENT_ID</code> and <code>EBAY_CLIENT_SECRET</code> in the environment.
          </p>
          <form action="/api/admin/settings" method="post" className="admin-form">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="intent" value="ebay" />
            <label>
              Seller username
              <input
                name="sellerUsername"
                defaultValue={settings.ebay.sellerUsername || process.env.EBAY_SELLER_USERNAME || ""}
                maxLength={80}
              />
            </label>
            <label>
              Public store URL (optional)
              <input name="storeUrl" defaultValue={settings.ebay.storeUrl} maxLength={500} />
            </label>
            <label>
              Import visibility
              <select name="importToVisibility" defaultValue={settings.ebay.importToVisibility}>
                <option value="public">Public</option>
                <option value="trade">Trade only</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" name="syncEnabled" value="on" defaultChecked={settings.ebay.syncEnabled} />
              Sync enabled
            </label>
            <fieldset>
              <legend>Category filters</legend>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  name="cat_jewellery"
                  value="on"
                  defaultChecked={settings.ebay.categories.jewellery}
                />
                Jewellery
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  name="cat_watches"
                  value="on"
                  defaultChecked={settings.ebay.categories.watches}
                />
                Watches
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  name="cat_looseStones"
                  value="on"
                  defaultChecked={settings.ebay.categories.looseStones}
                />
                Loose stones
              </label>
            </fieldset>
            <button className="btn btn-primary" type="submit">
              Save eBay settings
            </button>
          </form>
          <form action="/api/admin/ebay-import" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="csrf" value={csrf} />
            <button className="btn btn-ghost" type="submit" disabled={ebay.status !== "connected"}>
              Sync now
            </button>
          </form>
          {settings.ebay.lastImport ? (
            <p className="muted" style={{ marginTop: 12 }}>
              Last sync {new Date(settings.ebay.lastImport).toLocaleString("en-CA")}:{" "}
              {settings.ebay.lastResult}
            </p>
          ) : null}
        </div>

        <div className="aside-card">
          <h3>Payments (Stripe)</h3>
          <p>
            {paymentsConfigured()
              ? "Env present — live capture not enabled in this build."
              : "Not connected. Set STRIPE_SECRET_KEY when ready."}
          </p>
        </div>
        <div className="aside-card">
          <h3>Shipping</h3>
          <p>
            {shippingConfigured()
              ? "Env present — carrier rates not enabled in this build."
              : "Not connected. Set SHIPPING_API_KEY when ready."}
          </p>
        </div>
        <div className="aside-card">
          <h3>Accounting</h3>
          <p>
            {accountingConfigured()
              ? "Env present — sync not enabled in this build."
              : "Not connected. Set ACCOUNTING_API_KEY when ready."}
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
