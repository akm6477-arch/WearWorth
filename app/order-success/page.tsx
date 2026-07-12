import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="account-utility-page">
      <section className="container account-utility-card">
        <p className="eyebrow">ORDER CONFIRMED</p>
        <h1>Your WearWorth order is placed.</h1>
        <p>
          Cash on Delivery orders are now saved on the
          server. You can review them anytime from your
          account.
        </p>

        <div className="account-utility-actions">
          <Link href="/orders" className="button primary">
            VIEW ORDERS
          </Link>
          <Link href="/products" className="button ghost">
            CONTINUE SHOPPING
          </Link>
        </div>
      </section>
    </main>
  );
}
