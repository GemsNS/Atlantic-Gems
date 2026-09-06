import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({
  csrf,
  title,
  msg,
  error,
  children,
}: {
  csrf: string;
  title: string;
  msg?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section className="section admin" style={{ borderTop: 0 }}>
      <div className="wrap">
        <div className="admin-bar">
          <nav aria-label="Admin" className="admin-nav">
            <Link href="/admin">Inventory</Link>
            <Link href="/admin/items/new">Add item</Link>
            <Link href="/inventory" target="_blank" rel="noopener">
              View collection
            </Link>
          </nav>
          <form action="/api/admin/logout" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <button className="btn btn-ghost btn-small" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <h1 className="admin-title">{title}</h1>
        {msg ? (
          <div className="form-status ok" role="status">
            {msg}
          </div>
        ) : null}
        {error ? (
          <div className="form-status err" role="alert">
            {error}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
