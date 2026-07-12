"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

import ProductCard from "@/app/components/ProductCard";
import { useWishlist } from "@/app/context/WishlistContext";
import type { CatalogProduct } from "@/lib/catalog-types";

export default function WishlistPage() {
  const {
    wishlistSlugs,
    wishlistCount,
    clearWishlist,
  } = useWishlist();
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          products?: CatalogProduct[];
        };

        if (response.ok) {
          setProducts(data.products || []);
        }
      } catch {
        setProducts([]);
      }
    };

    void loadProducts();
  }, []);

  const wishlistProducts = useMemo(
    () =>
      products.filter((product) =>
        wishlistSlugs.includes(product.slug),
      ),
    [products, wishlistSlugs],
  );

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <div className="container wishlist-hero-grid">
          <div>
            <p className="eyebrow">YOUR SAVED STORIES</p>

            <h1>
              Pieces worth
              <span>remembering.</span>
            </h1>
          </div>

          <div className="wishlist-hero-copy">
            <p>
              Save the pieces that speak to your identity, ambition,
              memories and the person you are still becoming.
            </p>

            <div className="wishlist-count-card">
              <Heart size={20} />
              <div>
                <strong>{wishlistCount}</strong>
                <span>
                  {wishlistCount === 1
                    ? "saved product"
                    : "saved products"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container wishlist-content">
        {wishlistProducts.length > 0 ? (
          <>
            <div className="wishlist-toolbar">
              <div>
                <p>
                  SHOWING <strong>{wishlistProducts.length}</strong>{" "}
                  {wishlistProducts.length === 1
                    ? "PRODUCT"
                    : "PRODUCTS"}
                </p>

                <span>Your wishlist is stored in this browser.</span>
              </div>

              <button type="button" onClick={clearWishlist}>
                <Trash2 size={16} />
                CLEAR WISHLIST
              </button>
            </div>

            <div className="product-grid wishlist-product-grid">
              {wishlistProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <Heart size={34} />
            </div>

            <p className="eyebrow">YOUR WISHLIST IS EMPTY</p>

            <h2>
              You have not saved
              <span>your next chapter yet.</span>
            </h2>

            <p>
              Explore WearWorth collections and tap the heart icon
              on any product you want to remember.
            </p>

            <div className="wishlist-empty-actions">
              <Link href="/products" className="button primary">
                <ShoppingBag size={17} />
                EXPLORE PRODUCTS
              </Link>

              <Link href="/collections" className="button ghost">
                DISCOVER COLLECTIONS
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
