import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section" style={{ borderTop: 0, minHeight: "60vh" }}>
      <div className="wrap">
        <p className="eyebrow">404</p>
        <h1 style={{ fontSize: "3rem", marginTop: 10 }}>That page is not here.</h1>
        <p className="lede" style={{ marginTop: 16 }}>
          The address may have changed. Start again from the home page or contact us.
        </p>
        <div className="hero-ctas">
          <Link href="/" className="btn btn-primary">
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
