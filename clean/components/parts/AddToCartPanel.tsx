import Link from "next/link";
import { QtyStepper } from "@/components/parts/QtyStepper";

export function AddToCartPanel({
  csrf,
  partId,
  title,
  disabled,
}: {
  csrf: string;
  partId: string;
  title: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="part-buy">
        <div className="part-buy-row">
          <Link
            href={`/contact?brief=${encodeURIComponent(`Lead time enquiry: ${title}`)}`}
            className="btn btn-primary"
          >
            Ask for the lead time
          </Link>
        </div>
        <p className="part-buy-links">
          <Link href="/cart">View quote cart</Link>
        </p>
      </div>
    );
  }

  return (
    <form action="/api/cart/add" method="post" className="part-buy">
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="partId" value={partId} />
      <div className="part-buy-row">
        <QtyStepper label={`Quantity of ${title}`} size="lg" />
        <button className="btn btn-primary" type="submit">
          Add to quote cart
        </button>
      </div>
      <p className="part-buy-links">
        <Link href="/cart">View quote cart</Link>
        <Link href="/contact">Ask a question about this part</Link>
      </p>
    </form>
  );
}
