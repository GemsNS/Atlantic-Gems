import Link from "next/link";
import type { ReactNode } from "react";
import { adminError, adminMessage } from "@/lib/admin-messages";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/parts", label: "Parts" },
  { href: "/admin/jewellery", label: "Jewellery" },
  { href: "/admin/connect", label: "Connect" },
  { href: "/admin/follow-ups", label: "Follow-ups" },
];

/**
 * `msg` and `error` are the codes an admin action put in the URL; only the
 * fixed wording in lib/admin-messages.ts is shown, and an unknown code shows
 * nothing. `problem` is an alert the page itself worked out.
 */
export function AdminShell({
  csrf,
  title,
  msg,
  error,
  problem,
  children,
}: {
  csrf: string;
  title: string;
  msg?: string;
  error?: string;
  problem?: string;
  children: ReactNode;
}) {
  const status = adminMessage(msg);
  const alert = adminError(error) ?? problem;
  return (
    <section className="section admin" style={{ borderTop: 0 }}>
      <div className="wrap">
        <div className="admin-bar">
          <nav aria-label="Admin" className="admin-nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          <form action="/api/admin/logout" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <button className="btn btn-ghost btn-small" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <h1 className="admin-title">{title}</h1>
        {status ? (
          <div className="form-status ok" role="status">
            {status}
          </div>
        ) : null}
        {alert ? (
          <div className="form-status err" role="alert">
            {alert}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
