import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = nextRaw && nextRaw.startsWith("/admin") && !nextRaw.includes("://") ? nextRaw : "/admin";

  return (
    <section className="section" style={{ borderTop: 0 }}>
      <div className="wrap">
        <div className="login-card">
          <div>
            <p className="eyebrow">Atlantic Gems</p>
            <h1 style={{ fontSize: "2.2rem", marginTop: 10 }}>Inventory admin</h1>
          </div>
          {error === "1" ? <div className="form-status err" role="alert">Password not recognised.</div> : null}
          {error === "rate" ? <div className="form-status err" role="alert">Too many attempts. Wait a few minutes.</div> : null}
          {error === "config" ? (
            <div className="form-status err" role="alert">
              Admin access is not configured on this server (ADMIN_PASSWORD_HASH and SESSION_SECRET).
            </div>
          ) : null}
          <form className="form" action="/api/admin/login" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
