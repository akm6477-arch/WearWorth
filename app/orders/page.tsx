"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          orders?: Order[];
          error?: string;
        };

        if (!response.ok) {
          setError(data.error || "Unable to load orders.");
          return;
        }

        setOrders(data.orders || []);
      } catch {
        setError("Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, []);

  return (
    <main className="account-utility-page">
      <section className="container account-list-page">
        <p className="eyebrow">MY ORDERS</p>
        <h1>Your WearWorth order history.</h1>
        <p>
          Only your own orders are visible here. Admins can
          review all orders from the admin dashboard.
        </p>

        {loading ? <div className="account-list-loading" /> : null}
        {error ? <div className="account-form-error">{error}</div> : null}

        {!loading && !error && orders.length === 0 ? (
          <div className="account-empty-state">
            <p>No orders yet.</p>
            <Link href="/products" className="button primary">
              SHOP PRODUCTS
            </Link>
          </div>
        ) : null}

        <div className="account-list-grid">
          {orders.map((order) => (
            <article key={order.id} className="account-list-card">
              <p>{order.orderNumber}</p>
              <strong>Rs.{order.total.toLocaleString("en-IN")}</strong>
              <span>{order.status}</span>
              <small>
                {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </small>
              <Link href={`/orders/${order.id}`}>VIEW ORDER</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
