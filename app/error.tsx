"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="status-page">
      <section className="container status-card">
        <p className="eyebrow">SOMETHING WENT WRONG</p>
        <h1>We could not load this page.</h1>
        <p>
          Try again, or return to the store while we keep the rest of the
          experience available.
        </p>

        <div className="status-actions">
          <button type="button" className="button primary" onClick={reset}>
            <RotateCcw size={16} />
            TRY AGAIN
          </button>
          <Link href="/products" className="button ghost">
            SHOP PRODUCTS
          </Link>
        </div>
      </section>
    </main>
  );
}
