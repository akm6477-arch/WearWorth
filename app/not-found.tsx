import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="status-page">
      <section className="container status-card">
        <p className="eyebrow">404</p>
        <h1>This page is not in the collection.</h1>
        <p>
          The link may have moved, or the product may no longer be public.
        </p>

        <div className="status-actions">
          <Link href="/products" className="button primary">
            SHOP PRODUCTS
          </Link>
          <Link href="/" className="button ghost">
            GO HOME
          </Link>
        </div>
      </section>
    </main>
  );
}
