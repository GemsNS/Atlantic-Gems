import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings } from "@/lib/inventory/store";
import { PAGE_KEYS, PAGE_LABELS } from "@/lib/site-pages";

export const metadata: Metadata = { title: "Site controls", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminSitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const settings = await getSettings();

  return (
    <AdminShell csrf={csrf} title="Site controls" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        <div className="aside-card">
          <h3>Preset mode</h3>
          <p>
            Current: <strong>{settings.siteMode}</strong>. Default ship state is parts-supplier.
          </p>
          <form action="/api/admin/settings" method="post" className="admin-form">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="intent" value="mode" />
            <label>
              Mode
              <select name="siteMode" defaultValue={settings.siteMode === "custom" ? "parts-supplier" : settings.siteMode}>
                <option value="parts-supplier">Parts supplier</option>
                <option value="atelier">Atelier (jewellery house)</option>
                <option value="full-house">Full house (parts + atelier)</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Apply mode
            </button>
          </form>
        </div>

        <div className="aside-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Page visibility</h3>
          <p>
            Home, nav and footer only mention enabled pages. Disabled routes return 404.
            Collection also needs the shop open toggle (Jewellery admin).
          </p>
          <form action="/api/admin/settings" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="intent" value="pages" />
            <div className="admin-grid" style={{ marginTop: 16 }}>
              {PAGE_KEYS.map((key) => (
                <label key={key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name={`page_${key}`}
                    value="on"
                    defaultChecked={settings.pages[key]}
                  />
                  {PAGE_LABELS[key]}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: 20 }}>
              Save page toggles
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
