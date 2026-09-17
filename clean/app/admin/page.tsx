import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, listItems } from "@/lib/inventory/store";
import { listParts } from "@/lib/parts/store";
import { listContacts, listDeals, listQuotes, listTasks } from "@/lib/crm/store";
import { refreshFollowUps } from "@/lib/crm/followups";

export const metadata: Metadata = { title: "CRM Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const [settings, items, parts, contacts, deals, quotes] = await Promise.all([
    getSettings(),
    listItems(),
    listParts(),
    listContacts(),
    listDeals(),
    listQuotes(),
  ]);
  await refreshFollowUps();
  const tasks = (await listTasks()).filter((t) => t.status === "open");
  const ebayItems = items.filter((i) => i.source === "ebay" && i.status !== "sold");
  const lowStock = parts.filter((p) => p.stockQty <= p.reorderPoint);

  return (
    <AdminShell csrf={csrf} title="Dashboard" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        <div className="aside-card">
          <h3>Site mode</h3>
          <p>
            <strong>{settings.siteMode}</strong>
            {settings.pages.parts ? " · Parts on" : ""}
            {settings.pages.collection ? " · Collection page on" : ""}
            {settings.shopOpen ? " · Shop open" : " · Shop closed"}
          </p>
          <Link href="/admin/site" className="btn btn-ghost btn-small">
            Site controls
          </Link>
        </div>
        <div className="aside-card">
          <h3>Pipeline</h3>
          <ul className="facts" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
            <li>
              <span className="k">Contacts</span>
              <span className="v">{contacts.length}</span>
            </li>
            <li>
              <span className="k">Deals</span>
              <span className="v">{deals.length}</span>
            </li>
            <li>
              <span className="k">Quotes</span>
              <span className="v">{quotes.length}</span>
            </li>
            <li>
              <span className="k">Open tasks</span>
              <span className="v">{tasks.length}</span>
            </li>
          </ul>
        </div>
        <div className="aside-card">
          <h3>Inventory</h3>
          <ul className="facts" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
            <li>
              <span className="k">Parts SKUs</span>
              <span className="v">{parts.length}</span>
            </li>
            <li>
              <span className="k">Low stock</span>
              <span className="v">{lowStock.length}</span>
            </li>
            <li>
              <span className="k">Jewellery</span>
              <span className="v">{items.length}</span>
            </li>
            <li>
              <span className="k">From eBay</span>
              <span className="v">{ebayItems.length}</span>
            </li>
          </ul>
        </div>
        <div className="aside-card">
          <h3>eBay sync</h3>
          <p>
            {settings.ebay.lastImport
              ? `Last: ${new Date(settings.ebay.lastImport).toLocaleString("en-CA")} — ${settings.ebay.lastResult}`
              : "No sync yet."}
          </p>
          <Link href="/admin/connect" className="btn btn-ghost btn-small">
            Connect
          </Link>
        </div>
      </div>

      <h2 style={{ marginTop: 36 }}>Open follow-ups</h2>
      {tasks.length === 0 ? (
        <p className="muted">No open tasks. Stale quotes and low stock create tasks automatically.</p>
      ) : (
        <ul className="points">
          {tasks.slice(0, 12).map((t) => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
