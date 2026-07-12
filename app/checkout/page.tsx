"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  IndianRupee,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";

const FREE_SHIPPING_THRESHOLD = 999;

type PaymentMethod = "COD" | "ONLINE";
type DeliveryMethod = "STANDARD" | "EXPRESS";

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

interface CheckoutErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  isDefault: boolean;
}

const initialForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    count,
    total,
    hydrated,
    clearCart,
  } = useCart();

  const [form, setForm] =
    useState<CheckoutForm>(initialForm);
  const [errors, setErrors] =
    useState<CheckoutErrors>({});
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("COD");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("STANDARD");
  const [submitting, setSubmitting] =
    useState(false);
  const [submitError, setSubmitError] =
    useState("");
  const [savedAddresses, setSavedAddresses] =
    useState<SavedAddress[]>([]);

  useEffect(() => {
    if (user) {
      setForm((currentForm) => ({
        ...currentForm,
        fullName:
          currentForm.fullName || user.name || "",
        email:
          currentForm.email || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          addresses?: SavedAddress[];
        };

        const addresses = data.addresses || [];
        setSavedAddresses(addresses);

        const defaultAddress = addresses.find(
          (address) => address.isDefault,
        );

        if (defaultAddress) {
          applySavedAddress(defaultAddress);
        }
      } catch {
        // Checkout still works without saved addresses.
      }
    };

    void loadAddresses();
  }, []);

  const standardShipping =
    total >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const expressShipping = 199;
  const shipping =
    deliveryMethod === "EXPRESS"
      ? expressShipping
      : standardShipping;
  const finalTotal = total + shipping;

  const addressPreview = useMemo(() => {
    const addressParts = [
      form.address,
      form.apartment,
      form.landmark,
      form.city,
      form.state,
      form.pincode,
    ].filter((value) => value.trim());

    return addressParts.join(", ");
  }, [form]);

  const updateField = (
    field: keyof CheckoutForm,
    value: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (errors[field as keyof CheckoutErrors]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  };

  const applySavedAddress = (address: SavedAddress) => {
    setForm((currentForm) => ({
      ...currentForm,
      fullName: address.fullName || currentForm.fullName,
      phone: address.phone,
      address: address.addressLine1,
      apartment: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
    }));
  };

  const validateForm = () => {
    const nextErrors: CheckoutErrors = {};

    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (
      !/^[6-9]\d{9}$/.test(
        form.phone.trim(),
      )
    ) {
      nextErrors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (form.address.trim().length < 5) {
      nextErrors.address =
        "Enter your complete street address.";
    }

    if (form.city.trim().length < 2) {
      nextErrors.city = "Enter your city.";
    }

    if (form.state.trim().length < 2) {
      nextErrors.state = "Enter your state.";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode =
        "Enter a valid 6-digit pincode.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    if (!items.length) {
      setSubmitError("Your bag is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.product.slug,
            size: item.size,
            quantity: item.quantity,
          })),
          shippingAddress: form,
          deliveryMethod,
          paymentMethod,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: {
          id: string;
        };
      };

      if (!response.ok || !data.order) {
        setSubmitError(
          data.error ||
            "Unable to place your order right now.",
        );
        return;
      }

      clearCart();
      router.replace("/order-success");
      router.refresh();
    } catch {
      setSubmitError("Unable to place your order right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <main className="checkout-page">
        <section className="container checkout-loading">
          <div className="checkout-loading-line" />
          <div className="checkout-loading-grid">
            <div />
            <div />
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="container checkout-empty">
          <div className="checkout-empty-icon">
            <ShoppingBag size={36} />
          </div>

          <p className="eyebrow">
            NOTHING TO CHECK OUT
          </p>

          <h1>
            Your bag is
            <span>currently empty.</span>
          </h1>

          <p>
            Add at least one WearWorth piece
            before continuing to checkout.
          </p>

          <Link
            href="/products"
            className="button primary"
          >
            EXPLORE PRODUCTS
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-hero">
        <div className="container checkout-hero-grid">
          <div>
            <Link
              href="/cart"
              className="checkout-back-link"
            >
              <ArrowLeft size={16} />
              RETURN TO BAG
            </Link>

            <p className="eyebrow">
              SECURE CHECKOUT
            </p>

            <h1>
              Complete your
              <span>next chapter.</span>
            </h1>
          </div>

          <div className="checkout-hero-trust">
            <LockKeyhole size={24} />

            <div>
              <strong>Protected checkout</strong>
              <span>
                COD is live first. Online payments will be added after secure gateway integration.
              </span>
            </div>
          </div>
        </div>
      </section>

      <form
        className="container checkout-layout"
        onSubmit={handlePlaceOrder}
        noValidate
      >
        <div className="checkout-form-column">
          {savedAddresses.length > 0 ? (
            <section className="checkout-form-section">
              <div className="checkout-section-heading">
                <div className="checkout-section-number">
                  00
                </div>

                <div>
                  <p className="eyebrow">
                    SAVED ADDRESSES
                  </p>

                  <h2>Use an address you already saved.</h2>
                </div>

                <MapPin size={22} />
              </div>

              <div className="checkout-saved-addresses">
                {savedAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    className="checkout-saved-address-card"
                    onClick={() => applySavedAddress(address)}
                  >
                    <strong>
                      {address.label}
                      {address.isDefault ? " (Default)" : ""}
                    </strong>
                    <span>{address.fullName}</span>
                    <span>{address.phone}</span>
                    <small>
                      {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <div className="checkout-section-number">01</div>
              <div>
                <p className="eyebrow">CUSTOMER INFORMATION</p>
                <h2>Who is placing the order?</h2>
              </div>
              <UserRound size={22} />
            </div>

            <div className="checkout-fields-grid">
              <label className="checkout-field checkout-field-full">
                <span>FULL NAME *</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  autoComplete="name"
                />
                {errors.fullName && <small>{errors.fullName}</small>}
              </label>

              <label className="checkout-field">
                <span>EMAIL ADDRESS *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  autoComplete="email"
                />
                {errors.email && <small>{errors.email}</small>}
              </label>

              <label className="checkout-field">
                <span>MOBILE NUMBER *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  autoComplete="tel"
                />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
            </div>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <div className="checkout-section-number">02</div>
              <div>
                <p className="eyebrow">SHIPPING ADDRESS</p>
                <h2>Where should we deliver?</h2>
              </div>
              <MapPin size={22} />
            </div>

            <div className="checkout-fields-grid">
              <label className="checkout-field checkout-field-full">
                <span>HOUSE NUMBER AND STREET *</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
                {errors.address && <small>{errors.address}</small>}
              </label>

              <label className="checkout-field checkout-field-full">
                <span>APARTMENT, FLOOR OR BUILDING</span>
                <input
                  type="text"
                  value={form.apartment}
                  onChange={(event) =>
                    updateField("apartment", event.target.value)
                  }
                />
              </label>

              <label className="checkout-field">
                <span>CITY *</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
                />
                {errors.city && <small>{errors.city}</small>}
              </label>

              <label className="checkout-field">
                <span>STATE *</span>
                <input
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    updateField("state", event.target.value)
                  }
                />
                {errors.state && <small>{errors.state}</small>}
              </label>

              <label className="checkout-field">
                <span>PINCODE *</span>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(event) =>
                    updateField(
                      "pincode",
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                />
                {errors.pincode && <small>{errors.pincode}</small>}
              </label>

              <label className="checkout-field">
                <span>LANDMARK</span>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(event) =>
                    updateField("landmark", event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <div className="checkout-section-number">03</div>
              <div>
                <p className="eyebrow">DELIVERY METHOD</p>
                <h2>Choose your delivery speed.</h2>
              </div>
              <Truck size={22} />
            </div>

            <div className="checkout-option-list">
              <button
                type="button"
                className={
                  deliveryMethod === "STANDARD"
                    ? "checkout-option checkout-option-active"
                    : "checkout-option"
                }
                onClick={() => setDeliveryMethod("STANDARD")}
              >
                <span className="checkout-option-radio">
                  {deliveryMethod === "STANDARD" && <Check size={14} />}
                </span>

                <div>
                  <strong>Standard delivery</strong>
                  <p>Estimated delivery in 4-7 business days.</p>
                </div>

                <b>{standardShipping === 0 ? "FREE" : `Rs.${standardShipping}`}</b>
              </button>

              <button
                type="button"
                className={
                  deliveryMethod === "EXPRESS"
                    ? "checkout-option checkout-option-active"
                    : "checkout-option"
                }
                onClick={() => setDeliveryMethod("EXPRESS")}
              >
                <span className="checkout-option-radio">
                  {deliveryMethod === "EXPRESS" && <Check size={14} />}
                </span>

                <div>
                  <strong>Express delivery</strong>
                  <p>Estimated delivery in 2-3 business days.</p>
                </div>

                <b>Rs.{expressShipping}</b>
              </button>
            </div>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <div className="checkout-section-number">04</div>
              <div>
                <p className="eyebrow">PAYMENT METHOD</p>
                <h2>How would you like to pay?</h2>
              </div>
              <CreditCard size={22} />
            </div>

            <div className="checkout-option-list">
              <button
                type="button"
                className={
                  paymentMethod === "COD"
                    ? "checkout-option checkout-option-active"
                    : "checkout-option"
                }
                onClick={() => setPaymentMethod("COD")}
              >
                <span className="checkout-option-radio">
                  {paymentMethod === "COD" && <Check size={14} />}
                </span>

                <div>
                  <strong>Cash on Delivery</strong>
                  <p>Pay when your WearWorth order arrives.</p>
                </div>

                <IndianRupee size={20} />
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "ONLINE"
                    ? "checkout-option checkout-option-active"
                    : "checkout-option"
                }
                onClick={() => setPaymentMethod("ONLINE")}
              >
                <span className="checkout-option-radio">
                  {paymentMethod === "ONLINE" && <Check size={14} />}
                </span>

                <div>
                  <strong>Online payment</strong>
                  <p>Visible foundation only until Razorpay is connected.</p>
                </div>

                <CreditCard size={20} />
              </button>
            </div>

            {paymentMethod === "ONLINE" ? (
              <div className="checkout-payment-note">
                <ShieldCheck size={20} />
                <p>
                  Online payment is not active yet. Switch to Cash on Delivery to place this order today.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="checkout-summary">
          <p className="checkout-summary-eyebrow">
            ORDER SUMMARY
          </p>

          <h2>Review before you place the order.</h2>

          <div className="checkout-summary-count">
            <span>
              {count} {count === 1 ? "item" : "items"}
            </span>

            <Link href="/cart">EDIT BAG</Link>
          </div>

          <div className="checkout-summary-items">
            {items.map((item) => (
              <article key={`${item.product.id}-${item.size}`}>
                <div className="checkout-summary-image">
                  <Image
                    src={
                      item.product.image ||
                      "/images/wearworth-logo.jpeg"
                    }
                    alt={item.product.name}
                    fill
                    sizes="82px"
                  />
                  <span>{item.quantity}</span>
                </div>

                <div>
                  <Link href={`/products/${item.product.slug}`}>
                    <h3>{item.product.name}</h3>
                  </Link>

                  <p>Size {item.size || "Default"}</p>
                  <strong>
                    Rs.
                    {(
                      item.product.price *
                      item.quantity
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </article>
            ))}
          </div>

          <div className="checkout-address-preview">
            <MapPin size={18} />

            <div>
              <span>DELIVERY ADDRESS</span>
              <p>
                {addressPreview ||
                  "Your completed address will appear here."}
              </p>
            </div>
          </div>

          <div className="checkout-price-lines">
            <div>
              <span>Subtotal</span>
              <strong>Rs.{total.toLocaleString("en-IN")}</strong>
            </div>

            <div>
              <span>Delivery</span>
              <strong>
                {shipping === 0
                  ? "FREE"
                  : `Rs.${shipping.toLocaleString("en-IN")}`}
              </strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>{paymentMethod}</strong>
            </div>
          </div>

          <div className="checkout-total-row">
            <span>Total</span>
            <strong>Rs.{finalTotal.toLocaleString("en-IN")}</strong>
          </div>

          {submitError ? (
            <div className="account-form-error">{submitError}</div>
          ) : null}

          <button
            type="submit"
            className="checkout-place-order"
            disabled={submitting}
          >
            {submitting
              ? "PLACING ORDER..."
              : paymentMethod === "COD"
                ? "PLACE COD ORDER"
                : "CONTINUE TO PAYMENT"}

            {!submitting && <ChevronRight size={18} />}
          </button>

          <div className="checkout-secure-note">
            <LockKeyhole size={18} />
            <p>
              Your personal information will only be used to fulfil and support your order.
            </p>
          </div>

          <div className="checkout-promise">
            <PackageCheck size={21} />

            <div>
              <strong>The WearWorth promise</strong>
              <p>
                Honest pricing, clear order details and no manipulative checkout pressure.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}
