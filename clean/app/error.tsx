"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";
import { site } from "@/lib/site";

/**
 * Route-level error boundary. Keeps the header and footer in place, offers a
 * retry, and always leaves the customer a way to reach us.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const router = useRouter();
  // reset() alone re-renders the payload that failed; refresh fetches it again.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  useEffect(() => {
    heading.current?.focus();
    // Digest only: the message may carry server detail that should not be echoed.
    console.error(`[page] render failed${error.digest ? ` (${error.digest})` : ""}`);
  }, [error]);

  return (
    <section className="section" style={{ borderTop: 0, minHeight: "60vh" }}>
      <div className="wrap">
        <p className="eyebrow">Something went wrong</p>
        <h1 ref={heading} tabIndex={-1} style={{ fontSize: "3rem", marginTop: 10 }}>
          This page did not load.
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          Try again in a moment. If it keeps happening, write to{" "}
          <a className="link" href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          and tell us which page you were on.
          {error.digest ? ` Reference ${error.digest}.` : ""}
        </p>
        <div className="hero-ctas">
          <button type="button" className="btn btn-primary" onClick={retry}>
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
