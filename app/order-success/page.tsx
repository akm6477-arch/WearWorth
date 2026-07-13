import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
  }>;
}) {
  const params = await searchParams;
  const orderHref = params.order
    ? `/orders/${params.order}`
    : "/orders";

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
          <Link href={orderHref} className="button primary">
            VIEW ORDER
          </Link>
          <Link href="/products" className="button ghost">
            CONTINUE SHOPPING
          </Link>
        </div>
      </section>
    </main>
  );
}
