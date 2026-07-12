"use client";

import { useMemo, useState } from "react";
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

import { useCart } from "@/app/context/CartContext";

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartPage() {
  const {
    items,
    count,
    total,
    hydrated,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const discount = couponApplied ? Math.round(total * 0.1) : 0;
  const discountedSubtotal = Math.max(total - discount, 0);

  const shipping =
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD ||
    discountedSubtotal === 0
      ? 0
      : 99;

  const finalTotal = discountedSubtotal + shipping;

  const amountRemainingForFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - discountedSubtotal,
    0,
  );

  const shippingProgress = useMemo(() => {
    if (discountedSubtotal <= 0) {
      return 0;
    }

    return Math.min(
      (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100,
      100,
    );
  }, [discountedSubtotal]);

  const applyCoupon = () => {
    const normalizedCoupon = coupon.trim().toUpperCase();

    if (!normalizedCoupon) {
      setCouponApplied(false);
      setCouponMessage("Enter a coupon code.");
      return;
    }

    if (normalizedCoupon === "WEAR10") {
      setCouponApplied(true);
      setCouponMessage("WEAR10 applied — 10% discount added.");
      return;
    }

    setCouponApplied(false);
    setCouponMessage("This coupon code is not valid.");
  };

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
                      key={`${item.product.id}-${item.size}`}
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
                          </div>

                          <strong>
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </strong>
                        </div>

                        <blockquote>
                          “{item.product.statement}”
                        </blockquote>

                        <div className="premium-cart-actions">
                          <div className="premium-cart-quantity">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  item.product.id,
                                  item.size,
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
                              )
                            }
                          >
                            <Trash2 size={15} />
                            REMOVE
                          </button>
                        </div>

                        <div className="premium-cart-unit-price">
                          ₹{item.product.price.toLocaleString("en-IN")} each
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
                    <span>On qualifying orders above ₹999</span>
                  </div>
                </article>

                <article>
                  <ShieldCheck size={21} />

                  <div>
                    <strong>Protected checkout</strong>
                    <span>Secure payment foundation</span>
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
                      ₹
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
                <label htmlFor="coupon">COUPON CODE</label>

                <div>
                  <input
                    id="coupon"
                    type="text"
                    value={coupon}
                    onChange={(event) =>
                      setCoupon(event.target.value)
                    }
                    placeholder="Try WEAR10"
                  />

                  <button type="button" onClick={applyCoupon}>
                    APPLY
                  </button>
                </div>

                {couponMessage && (
                  <p
                    className={
                      couponApplied
                        ? "cart-coupon-success"
                        : "cart-coupon-error"
                    }
                  >
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="cart-price-breakdown">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    ₹{total.toLocaleString("en-IN")}
                  </strong>
                </div>

                {discount > 0 && (
                  <div className="cart-discount-line">
                    <span>Coupon discount</span>
                    <strong>
                      −₹{discount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}

                <div>
                  <span>Shipping</span>
                  <strong>
                    {shipping === 0
                      ? "FREE"
                      : `₹${shipping.toLocaleString("en-IN")}`}
                  </strong>
                </div>
              </div>

              <div className="cart-total-row">
                <span>Total</span>

                <strong>
                  ₹{finalTotal.toLocaleString("en-IN")}
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