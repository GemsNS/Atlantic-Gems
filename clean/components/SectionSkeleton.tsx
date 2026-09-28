import { site } from "@/lib/site";

/**
 * Placeholders for one section of a page while its data is read. They sit
 * inside a `<Suspense>` boundary *below* the page's visibility checks, never in
 * a route `loading.tsx`: a route-level boundary starts streaming before
 * `notFound()` can run, which turns a real 404 into a 200 (plan item U6).
 * No copy, only shapes, plus one line for screen readers.
 *
 * Streamed sections are swapped in by an inline script, so with JavaScript
 * off the placeholder is what stays on screen. The grid and tray placeholders
 * therefore carry a <noscript> line with the support address.
 */
function NoScriptNote({ what }: { what: string }) {
  return (
    <noscript>
      <p className="form-status err" style={{ maxWidth: "38rem" }}>
        {what} needs JavaScript to show here. Turn it on and reload, or email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </noscript>
  );
}

export function GridSkeleton({ cards = 6, label }: { cards?: number; label: string }) {
  return (
    <div aria-busy="true">
      <NoScriptNote what="This list" />
      <div className="skel-grid" aria-hidden="true">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="skel-card">
            <div className="skel skel-frame" />
            <div className="skel-body">
              <div className="skel skel-line w-40" />
              <div className="skel skel-line w-70" />
              <div className="skel skel-line w-55" />
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">
        {label}
      </p>
    </div>
  );
}

/** The four figures in a shop hero, as bare rules and blocks. */
export function StatsSkeleton() {
  return (
    <ul className="shop-stats" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i}>
          <b className="skel skel-stat" />
          <span className="skel skel-line w-70" />
        </li>
      ))}
    </ul>
  );
}

/** The tray lines and the quote form, side by side as on the cart page. */
export function CartSkeleton() {
  return (
    <div className="wrap cart-layout" aria-busy="true">
      <NoScriptNote what="The quote tray" />
      <div className="skel skel-cart-sheet" aria-hidden="true" />
      <div className="skel skel-cart-quote" aria-hidden="true" />
      <p className="sr-only" role="status">
        Loading the tray
      </p>
    </div>
  );
}
