"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Heart,
  ShoppingBag,
} from "lucide-react";

import type { CatalogProduct } from "@/lib/catalog-types";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";

interface ProductCardProps {
  product: CatalogProduct;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  const productUrl = `/products/${product.slug}`;
  const wishlisted = isInWishlist(product);
  const primaryImage =
    product.image || product.images[0] || "/images/wearworth-logo.jpeg";
  const outOfStock = product.stock <= 0;
  const requiresVariantChoice =
    product.sizes.length > 1 || product.colors.length > 1;
  const lowStock =
    !outOfStock && product.stock <= product.lowStockThreshold;

  const discountPercentage = useMemo(() => {
    if (
      !product.originalPrice ||
      product.originalPrice <= product.price
    ) {
      return 0;
    }

    return Math.round(
      ((product.originalPrice - product.price) /
        product.originalPrice) *
        100,
    );
  }, [product.originalPrice, product.price]);

  const handleAddToCart = () => {
    if (outOfStock) {
      return;
    }

    if (requiresVariantChoice) {
      router.push(productUrl);
      return;
    }

    addToCart(product);

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <article className="premium-product-card">
      <div className="premium-product-media">
        <Link
          href={productUrl}
          className="premium-product-image"
          aria-label={`View ${product.name}`}
        >
          <div className="premium-product-image-frame">
            <Image
              src={
                imageError || !primaryImage
                  ? "/images/wearworth-logo.jpeg"
                  : primaryImage
              }
              alt={product.name}
              fill
              sizes="
                (max-width: 620px) 100vw,
                (max-width: 980px) 50vw,
                25vw
              "
              onError={() => setImageError(true)}
            />
          </div>
        </Link>

        <div className="premium-product-badges">
          <span className="premium-product-new-badge">
            NEW DROP
          </span>

          {discountPercentage > 0 && (
            <span className="premium-product-discount-badge">
              {discountPercentage}% OFF
            </span>
          )}

          {outOfStock ? (
            <span className="premium-product-stock-badge">
              OUT OF STOCK
            </span>
          ) : lowStock ? (
            <span className="premium-product-stock-badge">
              LOW STOCK
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className={`premium-product-wishlist ${
            wishlisted
              ? "premium-product-wishlist-active"
              : ""
          }`}
          onClick={() => toggleWishlist(product)}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
        >
          <Heart
            size={19}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        <div className="premium-product-hover-actions">
          <Link
            href={productUrl}
            className="premium-product-quick-view"
          >
            <Eye size={17} />
            QUICK VIEW
          </Link>

          <button
            type="button"
            className="premium-product-add-hover"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingBag size={17} />
            {outOfStock
              ? "OUT OF STOCK"
              : requiresVariantChoice
                ? "CHOOSE OPTIONS"
                : added
                  ? "ADDED"
                  : "ADD TO CART"}
          </button>
        </div>
      </div>

      <div className="premium-product-content">
        <div className="premium-product-meta">
          <p>
            {product.category} / {product.audience}
          </p>
        </div>

        <Link href={productUrl}>
          <h3>{product.name}</h3>
        </Link>

        <blockquote>
          “{product.statement}”
        </blockquote>

        <div className="premium-product-bottom">
          <div className="premium-product-price">
            <span>
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {product.originalPrice &&
              product.originalPrice > product.price && (
                <del>
                  ₹
                  {product.originalPrice.toLocaleString(
                    "en-IN",
                  )}
                </del>
              )}
          </div>

          <button
            type="button"
            className={`premium-product-add-button ${
              added
                ? "premium-product-add-button-success"
                : ""
            }`}
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={
              requiresVariantChoice
                ? `Choose options for ${product.name}`
                : `Add ${product.name} to cart`
            }
          >
            <ShoppingBag size={16} />

            <span>
              {outOfStock
                ? "SOLD"
                : requiresVariantChoice
                  ? "CHOOSE"
                  : added
                    ? "ADDED"
                    : "ADD"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
