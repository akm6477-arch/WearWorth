"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface OrderItem {
  name: string;
  quantity: number;
  size: string;
  total: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          order?: OrderDetail;
          error?: string;
        };

        if (!response.ok) {
          setError(data.error || "Unable to load order.");
          return;
        }

        setOrder(data.order || null);
      } catch {
        setError("Unable to load order.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void loadOrder();
    }
  }, [params.id]);

  return (
    <main className="account-utility-page">
      <section className="container account-detail-page">
        <Link href="/orders" className="account-utility-link">
          Back to orders
        </Link>

        {loading ? <div className="account-list-loading" /> : null}
        {error ? <div className="account-form-error">{error}</div> : null}

        {order ? (
          <div className="account-detail-card">
            <p className="eyebrow">{order.orderNumber}</p>
            <h1>Order details</h1>
            <div className="account-detail-stats">
              <span>Status: {order.status}</span>
              <span>Payment: {order.paymentStatus}</span>
              <span>
                Placed: {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>

            <div className="account-detail-items">
              {order.items.map((item, index) => (
                <article key={`${item.name}-${index}`}>
                  <strong>{item.name}</strong>
                  <span>Size: {item.size}</span>
                  <span>Qty: {item.quantity}</span>
                  <b>Rs.{item.total.toLocaleString("en-IN")}</b>
                </article>
              ))}
            </div>

            <div className="account-detail-totals">
              <span>Subtotal: Rs.{order.subtotal.toLocaleString("en-IN")}</span>
              <span>Shipping: Rs.{order.shipping.toLocaleString("en-IN")}</span>
              <strong>Total: Rs.{order.total.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
