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
  Truck,
} from "lucide-react";

import ProductCard from "@/app/components/ProductCard";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import type { CatalogProduct } from "@/lib/catalog-types";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { addToCart } = useCart();
  const {
    isInWishlist,
    toggleWishlist: toggleProductWishlist,
  } = useWishlist();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
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

    if (product?.colors?.length) {
      setSelectedColor(product.colors[0]);
    }

    if (product) {
      setSelectedImage(
        product.image ||
          product.images[0] ||
          "/images/wearworth-logo.jpeg",
      );
      setImageError(false);
    }
  }, [product]);

  useEffect(() => {
    setImageError(false);
  }, [selectedImage]);

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

  const galleryImages = useMemo(() => {
    if (!product) {
      return ["/images/wearworth-logo.jpeg"];
    }

    return Array.from(
      new Set(
        [
          product.image,
          ...product.images,
          "/images/wearworth-logo.jpeg",
        ].filter(Boolean),
      ),
    );
  }, [product]);

  const outOfStock = product ? product.stock <= 0 : false;
  const lowStock =
    product &&
    product.stock > 0 &&
    product.stock <= product.lowStockThreshold;
  const wishlisted = product ? isInWishlist(product) : false;

  const toggleWishlist = () => {
    if (!product) {
      return;
    }

    toggleProductWishlist(product);
  };

  const handleAddToCart = () => {
    if (
      !product ||
      !selectedSize ||
      outOfStock ||
      (product.colors.length > 0 && !selectedColor)
    ) {
      return;
    }

    addToCart(product, selectedSize, quantity, selectedColor);

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
                  imageError || !selectedImage
                    ? "/images/wearworth-logo.jpeg"
                    : selectedImage
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
              {outOfStock ? <strong>OUT OF STOCK</strong> : null}
              {lowStock ? <strong>ONLY {product.stock} LEFT</strong> : null}
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
            <div className="product-thumbnail-grid">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    selectedImage === image
                      ? "product-thumbnail-active"
                      : ""
                  }
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <div className="product-thumbnail-frame">
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="100px"
                    />
                  </div>
                </button>
              ))}
            </div>

            <div className="product-gallery-message">
              <span>{product.sku}</span>
              <p>
                {product.material} / {product.fit} / {product.audience}
              </p>
            </div>
          </div>
        </div>

        <div className="product-information">
          <div className="product-information-top">
            <p className="eyebrow">
              {product.category} / {product.audience}
            </p>
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

          <div className="product-stock-note">
            {outOfStock
              ? "Out of stock"
              : lowStock
                ? `Only ${product.stock} left in stock`
                : `${product.stock} available`}
          </div>

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

          <div className="product-color-section">
            <div className="product-option-heading">
              <div>
                <span>SELECT COLOR</span>
                {selectedColor && (
                  <strong>Selected: {selectedColor}</strong>
                )}
              </div>
            </div>

            <div className="premium-color-list">
              {product.colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={
                    selectedColor === color
                      ? "premium-color-active"
                      : ""
                  }
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
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
              disabled={!selectedSize || outOfStock}
            >
              {added ? (
                <>
                  <Check size={19} />
                  ADDED TO BAG
                </>
              ) : outOfStock ? (
                <>
                  <ShoppingBag size={19} />
                  OUT OF STOCK
                </>
              ) : (
                <>
                  <ShoppingBag size={19} />
                  ADD TO BAG
                </>
              )}
            </button>
          </div>

          {!selectedSize && !outOfStock && (
            <p className="product-size-warning">
              Select a size before adding this product to your bag.
            </p>
          )}

          <div className="product-service-grid">
            <article>
              <Truck size={21} />
              <div>
                <strong>Free shipping</strong>
                <span>
                  {outOfStock
                    ? "Restock timing will appear here"
                    : "Ships after confirmation"}
                </span>
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
                <span>Cash on Delivery enabled</span>
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
                    <li>Material: {product.material}</li>
                    <li>Fit: {product.fit}</li>
                    <li>Colors: {product.colors.join(", ")}</li>
                    <li>Audience: {product.audience}</li>
                    <li>SKU: {product.sku}</li>
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
                    {outOfStock
                      ? "This product is currently out of stock. Delivery opens again after restock."
                      : "Delivery is estimated after order confirmation. Final timelines are shown at checkout."}
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
                    {product.washCare}
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
