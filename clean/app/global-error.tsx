"use client";

import "./globals.css";
import { site } from "@/lib/site";

/**
 * Last-resort boundary for failures in the root layout itself (header, footer
 * or settings). Plain markup, no data dependencies.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-CA">
      <body>
        <main id="main">
          <section className="section" style={{ borderTop: 0, minHeight: "70vh" }}>
            <div className="wrap">
              <p className="eyebrow">{site.name}</p>
              <h1 style={{ fontSize: "3rem", marginTop: 10 }}>The site did not load.</h1>
              <p className="lede" style={{ marginTop: 16 }}>
                Please try again in a moment. You can always reach us at{" "}
                <a className="link" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                .{error.digest ? ` Reference ${error.digest}.` : ""}
              </p>
              <div className="hero-ctas">
                <button type="button" className="btn btn-primary" onClick={() => reset()}>
                  Try again
                </button>
                {/* A full reload on purpose: client navigation is what just failed. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/" className="btn btn-ghost">
                  Home
                </a>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
