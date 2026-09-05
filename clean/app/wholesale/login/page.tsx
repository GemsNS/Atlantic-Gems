import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Trade Sign In",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WholesaleLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNextPath(nextRaw);
  const error = params.error;

  return (
    <section className="section" style={{ borderTop: 0 }}>
      <div className="wrap">
        <div className="login-card">
          <div>
            <p className="eyebrow">Trade access</p>
            <h1 style={{ fontSize: "2.2rem", marginTop: 10 }}>Sign in</h1>
            <p style={{ color: "var(--fog)", marginTop: 12 }}>
              Enter the access phrase provided to your business. Trade pricing and parcels are
              confidential.
            </p>
          </div>

          {error === "1" ? (
            <div className="form-status err" role="alert">
              That access phrase was not recognised.
            </div>
          ) : null}
          {error === "rate" ? (
            <div className="form-status err" role="alert">
              Too many attempts. Please wait a few minutes and try again.
            </div>
          ) : null}
          {error === "config" ? (
            <div className="form-status err" role="alert">
              Trade access is not available right now. Please contact us directly.
            </div>
          ) : null}

          <form className="form" action="/api/wholesale/login" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="passphrase">Access phrase</label>
              <input
                id="passphrase"
                name="passphrase"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </div>
            <div>
              <button className="btn btn-primary" type="submit">
                Enter trade area
              </button>
            </div>
          </form>

          <p style={{ color: "var(--mist)", fontSize: "0.9rem" }}>
            Not yet a trade client?{" "}
            <Link href="/contact?type=wholesale" style={{ color: "var(--gold-2)" }}>
              Request access
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
