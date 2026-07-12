"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Heart,
  ShoppingBag,
  Star,
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
  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  const productUrl = `/products/${product.slug}`;
  const wishlisted = isInWishlist(product);

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
                imageError || !product.image
                  ? "/images/wearworth-logo.jpeg"
                  : product.image
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
          >
            <ShoppingBag size={17} />
            {added ? "ADDED" : "ADD TO CART"}
          </button>
        </div>
      </div>

      <div className="premium-product-content">
        <div className="premium-product-meta">
          <p>{product.category}</p>

          <div
            className="premium-product-rating"
            aria-label="Five-star product"
          >
            <Star size={12} fill="currentColor" />
            <Star size={12} fill="currentColor" />
            <Star size={12} fill="currentColor" />
            <Star size={12} fill="currentColor" />
            <Star size={12} fill="currentColor" />
          </div>
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
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={16} />

            <span>{added ? "ADDED" : "ADD"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
