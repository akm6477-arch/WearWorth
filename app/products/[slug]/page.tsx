"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";

import ProductCard from "@/app/components/ProductCard";
import { useCart } from "@/app/context/CartContext";
import type { CatalogProduct } from "@/lib/catalog-types";

const WISHLIST_STORAGE_KEY = "wearworth-wishlist";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { addToCart } = useCart();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/products/${slug}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          product?: CatalogProduct;
          relatedProducts?: CatalogProduct[];
        };

        if (response.ok && data.product) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      } catch {
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      void loadProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product?.sizes?.length) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    try {
      const savedWishlist = localStorage.getItem(
        WISHLIST_STORAGE_KEY,
      );

      const wishlistItems: string[] = savedWishlist
        ? JSON.parse(savedWishlist)
        : [];

      setWishlisted(wishlistItems.includes(product.slug));
    } catch {
      setWishlisted(false);
    }
  }, [product]);

  const discountPercentage = useMemo(() => {
    if (
      !product?.originalPrice ||
      product.originalPrice <= product.price
    ) {
      return 0;
    }

    return Math.round(
      ((product.originalPrice - product.price) /
        product.originalPrice) *
        100,
    );
  }, [product]);

  const toggleWishlist = () => {
    if (!product) {
      return;
    }

    try {
      const savedWishlist = localStorage.getItem(
        WISHLIST_STORAGE_KEY,
      );

      const wishlistItems: string[] = savedWishlist
        ? JSON.parse(savedWishlist)
        : [];

      const updatedWishlist = wishlistItems.includes(product.slug)
        ? wishlistItems.filter((item) => item !== product.slug)
        : [...wishlistItems, product.slug];

      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(updatedWishlist),
      );

      setWishlisted(updatedWishlist.includes(product.slug));
    } catch {
      setWishlisted((currentValue) => !currentValue);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedSize) {
      return;
    }

    for (let item = 0; item < quantity; item += 1) {
      addToCart(product, selectedSize);
    }

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  if (loading) {
    return (
      <main className="account-utility-page">
        <section className="container account-list-loading" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-not-found container">
        <p className="eyebrow">PRODUCT NOT FOUND</p>
        <h1>This WearWorth chapter does not exist.</h1>
        <p>
          The product may have been removed, renamed or moved to another collection.
        </p>
        <Link href="/products" className="button primary">
          RETURN TO PRODUCTS
        </Link>
      </main>
    );
  }

  return (
    <main className="premium-product-page">
      <section className="product-breadcrumb-section">
        <div className="container product-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>
          <p>{product.name}</p>
        </div>
      </section>

      <section className="container premium-product-detail">
        <div className="product-gallery-section">
          <div className="product-main-image">
            <div className="product-main-image-frame">
              <Image
                src={
                  imageError || !product.image
                    ? "/images/wearworth-logo.jpeg"
                    : product.image
                }
                alt={product.name}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
                onError={() => setImageError(true)}
              />
            </div>

            <div className="product-image-badges">
              <span>NEW DROP</span>
              {discountPercentage > 0 && (
                <strong>{discountPercentage}% OFF</strong>
              )}
            </div>

            <button
              type="button"
              className={`product-gallery-wishlist ${
                wishlisted ? "product-gallery-wishlist-active" : ""
              }`}
              onClick={toggleWishlist}
              aria-label={
                wishlisted
                  ? "Remove product from wishlist"
                  : "Add product to wishlist"
              }
            >
              <Heart
                size={21}
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="product-thumbnail-list">
            <button
              type="button"
              className="product-thumbnail-active"
              aria-label="View main product image"
            >
              <div className="product-thumbnail-frame">
                <Image
                  src={
                    imageError || !product.image
                      ? "/images/wearworth-logo.jpeg"
                      : product.image
                  }
                  alt={product.name}
                  fill
                  sizes="100px"
                />
              </div>
            </button>

            <div className="product-gallery-message">
              <span>WEARWORTH PRODUCT VIEW</span>
              <p>
                More product photographs and model views will be added through the
                admin dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="product-information">
          <div className="product-information-top">
            <p className="eyebrow">{product.category}</p>

            <div className="product-detail-rating">
              <div>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>

              <span>5.0 · WearWorth Drop</span>
            </div>
          </div>

          <h1>{product.name}</h1>
          <blockquote>"{product.statement}"</blockquote>
          <p className="product-detail-description">{product.description}</p>

          <div className="product-detail-price">
            <strong>Rs.{product.price.toLocaleString("en-IN")}</strong>
            {product.originalPrice &&
              product.originalPrice > product.price && (
                <>
                  <del>Rs.{product.originalPrice.toLocaleString("en-IN")}</del>
                  <span>Save {discountPercentage}%</span>
                </>
              )}
          </div>

          <p className="product-tax-note">Inclusive of all taxes</p>

          <div className="product-size-section">
            <div className="product-option-heading">
              <div>
                <span>SELECT SIZE</span>
                {selectedSize && <strong>Selected: {selectedSize}</strong>}
              </div>

              <button type="button">
                <Ruler size={16} />
                SIZE GUIDE
              </button>
            </div>

            <div className="premium-size-list">
              {product.sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={
                    selectedSize === size ? "premium-size-active" : ""
                  }
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="product-purchase-row">
            <div className="product-quantity">
              <button
                type="button"
                onClick={() =>
                  setQuantity((currentQuantity) =>
                    Math.max(currentQuantity - 1, 1),
                  )
                }
                disabled={quantity === 1}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((currentQuantity) =>
                    Math.min(currentQuantity + 1, 10),
                  )
                }
                disabled={quantity === 10}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              className={`product-add-to-bag ${
                added ? "product-add-to-bag-success" : ""
              }`}
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              {added ? (
                <>
                  <Check size={19} />
                  ADDED TO BAG
                </>
              ) : (
                <>
                  <ShoppingBag size={19} />
                  ADD TO BAG
                </>
              )}
            </button>
          </div>

          {!selectedSize && (
            <p className="product-size-warning">
              Select a size before adding this product to your bag.
            </p>
          )}

          <div className="product-service-grid">
            <article>
              <Truck size={21} />
              <div>
                <strong>Free shipping</strong>
                <span>On orders above Rs.999</span>
              </div>
            </article>

            <article>
              <RotateCcw size={21} />
              <div>
                <strong>Easy returns</strong>
                <span>Simple customer support</span>
              </div>
            </article>

            <article>
              <ShieldCheck size={21} />
              <div>
                <strong>Secure checkout</strong>
                <span>Protected payments</span>
              </div>
            </article>
          </div>

          <div className="product-accordion-list">
            <article>
              <button type="button" onClick={() => setDetailsOpen(!detailsOpen)}>
                <span>PRODUCT DETAILS</span>
                <ChevronDown
                  size={18}
                  className={detailsOpen ? "accordion-open" : ""}
                />
              </button>

              {detailsOpen && (
                <div className="product-accordion-content">
                  <p>
                    Premium identity-led clothing designed around the WearWorth philosophy.
                  </p>
                  <ul>
                    <li>Statement-led design</li>
                    <li>Comfort-focused everyday fit</li>
                    <li>Designed for repeat wear</li>
                    <li>
                      Collection: {product.collection || "WearWorth Essentials"}
                    </li>
                    <li>Stock available: {product.stock}</li>
                  </ul>
                </div>
              )}
            </article>

            <article>
              <button type="button" onClick={() => setDeliveryOpen(!deliveryOpen)}>
                <span>DELIVERY & RETURNS</span>
                <ChevronDown
                  size={18}
                  className={deliveryOpen ? "accordion-open" : ""}
                />
              </button>

              {deliveryOpen && (
                <div className="product-accordion-content">
                  <p>
                    Delivery time and return eligibility will be shown accurately after the checkout and logistics systems are connected.
                  </p>
                </div>
              )}
            </article>

            <article>
              <button type="button" onClick={() => setCareOpen(!careOpen)}>
                <span>PRODUCT CARE</span>
                <ChevronDown
                  size={18}
                  className={careOpen ? "accordion-open" : ""}
                />
              </button>

              {careOpen && (
                <div className="product-accordion-content">
                  <p>
                    Wash garments inside out using cold water. Avoid bleach, harsh chemicals and direct ironing over printed areas.
                  </p>
                </div>
              )}
            </article>
          </div>

          <div className="product-wearworth-promise">
            <PackageCheck size={24} />
            <div>
              <strong>The WearWorth Promise</strong>
              <p>
                Clear product information, honest pricing and no manipulative countdown pressure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="product-story-section">
        <div className="container product-story-grid">
          <div>
            <p className="eyebrow">THE STORY BEHIND THE PIECE</p>
            <h2>{product.statement}</h2>
          </div>

          <div>
            <p>
              This design belongs to a WearWorth chapter built around identity,
              personal growth and the courage to keep becoming.
            </p>

            <p>
              It is not intended to tell people who they should be. It exists to help
              them recognise something already present within themselves.
            </p>

            <Link href="/about">DISCOVER THE WEARWORTH PHILOSOPHY -&gt;</Link>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section container">
          <div className="section-head premium-section-head">
            <div>
              <p className="eyebrow">CONTINUE THE STORY</p>
              <h2>You may also connect with these pieces.</h2>
            </div>

            <Link href="/products">VIEW ALL PRODUCTS -&gt;</Link>
          </div>

          <div className="product-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.slug}
                product={relatedProduct}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
