"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import {
  type CartItem,
  useCart,
} from "@/app/context/CartContext";

const FREE_SHIPPING_THRESHOLD = 999;

interface CartReconcileResponse {
  items?: Array<
    CartItem & {
      lineTotal?: number;
    }
  >;
  changed?: boolean;
  notices?: string[];
  error?: string;
}

export default function CartPage() {
  const {
    items,
    count,
    total,
    hydrated,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    replaceCart,
    clearCart,
  } = useCart();
  const [cartNotices, setCartNotices] = useState<string[]>([]);
  const [refreshingCart, setRefreshingCart] = useState(false);
  const lastReconciledSignature = useRef("");

  const shipping =
    total >= FREE_SHIPPING_THRESHOLD ||
    total === 0
      ? 0
      : 99;

  const finalTotal = total + shipping;

  const amountRemainingForFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - total,
    0,
  );

  const shippingProgress = useMemo(() => {
    if (total <= 0) {
      return 0;
    }

    return Math.min(
      (total / FREE_SHIPPING_THRESHOLD) * 100,
      100,
    );
  }, [total]);

  const cartSignature = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.product.slug}:${item.size}:${item.color}:${item.quantity}`,
        )
        .join("|"),
    [items],
  );

  useEffect(() => {
    if (
      !hydrated ||
      !items.length ||
      !cartSignature ||
      lastReconciledSignature.current === cartSignature
    ) {
      return;
    }

    let cancelled = false;
    lastReconciledSignature.current = cartSignature;

    const reconcileCart = async () => {
      setRefreshingCart(true);

      try {
        const response = await fetch("/api/cart/reconcile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              slug: item.product.slug,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
            })),
          }),
        });
        const data =
          (await response.json()) as CartReconcileResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setCartNotices([
            data.error ||
              "Unable to refresh current product availability.",
          ]);
          return;
        }

        if (data.changed && data.items) {
          replaceCart(
            data.items.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
            })),
          );
        }

        setCartNotices(data.notices || []);
      } catch {
        if (!cancelled) {
          setCartNotices([
            "Unable to refresh current product availability.",
          ]);
        }
      } finally {
        if (!cancelled) {
          setRefreshingCart(false);
        }
      }
    };

    void reconcileCart();

    return () => {
      cancelled = true;
    };
  }, [cartSignature, hydrated, items, replaceCart]);

  if (!hydrated) {
    return (
      <main className="cart-page">
        <section className="container cart-loading">
          <div className="cart-loading-line" />
          <div className="cart-loading-block" />
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-hero">
        <div className="container cart-hero-grid">
          <div>
            <p className="eyebrow">YOUR WEARWORTH BAG</p>

            <h1>
              Things that
              <span>felt like you.</span>
            </h1>
          </div>

          <div className="cart-hero-summary">
            <ShoppingBag size={22} />

            <div>
              <strong>{count}</strong>
              <span>
                {count === 1 ? "item in your bag" : "items in your bag"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container cart-content">
        {items.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">
              <ShoppingBag size={36} />
            </div>

            <p className="eyebrow">YOUR BAG IS EMPTY</p>

            <h2>
              Your next chapter
              <span>is still waiting.</span>
            </h2>

            <p>
              Explore pieces built around identity, ambition, courage and the
              person you are still becoming.
            </p>

            <div className="cart-empty-actions">
              <Link href="/products" className="button primary">
                SHOP PRODUCTS
                <ArrowRight size={17} />
              </Link>

              <Link href="/collections" className="button ghost">
                VIEW COLLECTIONS
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-layout-premium">
            <div className="cart-items-column">
              <div className="cart-items-heading">
                <div>
                  <p>
                    BAG ITEMS <strong>{count}</strong>
                  </p>

                  <span>
                    Review sizes and quantities before checkout.
                  </span>
                </div>

                <button type="button" onClick={clearCart}>
                  <Trash2 size={15} />
                  CLEAR BAG
                </button>
              </div>

              <div className="cart-items-list">
                {items.map((item) => {
                  const itemTotal =
                    item.product.price * item.quantity;

                  return (
                    <article
                      className="premium-cart-item"
                      key={`${item.product.id}-${item.size}-${item.color}`}
                    >
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="premium-cart-image"
                      >
                        <Image
                          src={
                            item.product.image ||
                            "/images/wearworth-logo.jpeg"
                          }
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 620px) 120px, 180px"
                        />
                      </Link>

                      <div className="premium-cart-copy">
                        <div className="premium-cart-copy-top">
                          <div>
                            <p>{item.product.category}</p>

                            <Link
                              href={`/products/${item.product.slug}`}
                            >
                              <h2>{item.product.name}</h2>
                            </Link>

                            <span>Size: {item.size || "Default"}</span>
                            {item.color ? (
                              <span>Color: {item.color}</span>
                            ) : null}
                          </div>

                          <strong>
                            Rs.{itemTotal.toLocaleString("en-IN")}
                          </strong>
                        </div>

                        <blockquote>
                          "{item.product.statement}"
                        </blockquote>

                        <div className="premium-cart-actions">
                          <div className="premium-cart-quantity">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color,
                                )
                              }
                              aria-label={`Decrease quantity of ${item.product.name}`}
                            >
                              <Minus size={15} />
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color,
                                )
                              }
                              disabled={item.quantity >= 10}
                              aria-label={`Increase quantity of ${item.product.name}`}
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="premium-cart-remove"
                            onClick={() =>
                              removeFromCart(
                                item.product.id,
                                item.size,
                                item.color,
                              )
                            }
                          >
                            <Trash2 size={15} />
                            REMOVE
                          </button>
                        </div>

                        <div className="premium-cart-unit-price">
                          Rs.{item.product.price.toLocaleString("en-IN")} each
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="cart-service-strip">
                <article>
                  <Truck size={21} />

                  <div>
                    <strong>Free shipping</strong>
                    <span>On qualifying orders above Rs.999</span>
                  </div>
                </article>

                <article>
                  <ShieldCheck size={21} />

                  <div>
                    <strong>Protected checkout</strong>
                    <span>Cash on Delivery available</span>
                  </div>
                </article>

                <article>
                  <PackageCheck size={21} />

                  <div>
                    <strong>Honest support</strong>
                    <span>Clear product and delivery information</span>
                  </div>
                </article>
              </div>
            </div>

            <aside className="cart-summary-card">
              <p className="cart-summary-eyebrow">ORDER SUMMARY</p>

              <h2>Ready for your next chapter?</h2>

              <div className="free-shipping-box">
                {amountRemainingForFreeShipping > 0 ? (
                  <p>
                    Add{" "}
                    <strong>
                      Rs.
                      {amountRemainingForFreeShipping.toLocaleString(
                        "en-IN",
                      )}
                    </strong>{" "}
                    more for free shipping.
                  </p>
                ) : (
                  <p className="free-shipping-achieved">
                    <Check size={16} />
                    You unlocked free shipping.
                  </p>
                )}

                <div className="free-shipping-track">
                  <span
                    style={{
                      width: `${shippingProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="cart-coupon">
                <strong>Coupons are not active yet.</strong>
                <p>
                  Discounts will appear here only after server-side coupon validation is connected.
                </p>
              </div>

              {refreshingCart ? (
                <p className="cart-refreshing-note">
                  Refreshing product price and stock...
                </p>
              ) : null}

              {cartNotices.length > 0 ? (
                <div className="cart-reconcile-note">
                  <strong>Bag updated</strong>
                  {cartNotices.map((notice) => (
                    <p key={notice}>{notice}</p>
                  ))}
                </div>
              ) : null}

              <div className="cart-price-breakdown">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    Rs.{total.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Shipping</span>
                  <strong>
                    {shipping === 0
                      ? "FREE"
                      : `Rs.${shipping.toLocaleString("en-IN")}`}
                  </strong>
                </div>
              </div>

              <div className="cart-total-row">
                <span>Total</span>

                <strong>
                  Rs.{finalTotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <p className="cart-tax-note">
                Inclusive of all applicable taxes.
              </p>

              <Link
                href="/checkout"
                className="cart-checkout-button"
              >
                PROCEED TO CHECKOUT
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/products"
                className="cart-continue-shopping"
              >
                CONTINUE SHOPPING
              </Link>

              <div className="cart-trust-note">
                <ShieldCheck size={18} />

                <p>
                  No manipulative countdowns. Review your order at your own
                  pace.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
