"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import ProductCard from "@/app/components/ProductCard";
import type {
  CatalogProduct,
  ProductAudience,
  ProductSortOption,
} from "@/lib/catalog-types";

interface ProductsPageClientProps {
  initialCategories: string[];
  initialAudiences: ProductAudience[];
  initialProducts: CatalogProduct[];
  initialSource: string;
  initialSearch: string;
  initialSelectedCategory: string;
  initialSelectedAudience: string;
  initialSort: ProductSortOption;
}

export default function ProductsPageClient({
  initialCategories,
  initialAudiences,
  initialProducts,
  initialSource,
  initialSearch,
  initialSelectedCategory,
  initialSelectedAudience,
  initialSort,
}: ProductsPageClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(
    initialSelectedCategory,
  );
  const [selectedAudience, setSelectedAudience] = useState(
    initialSelectedAudience,
  );
  const [sortBy, setSortBy] =
    useState<ProductSortOption>(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] =
    useState<CatalogProduct[]>(initialProducts);
  const [categories, setCategories] = useState<string[]>([
    "All",
    ...initialCategories,
  ]);
  const [audiences, setAudiences] = useState<string[]>([
    "All",
    ...initialAudiences,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState(initialSource);

  useEffect(() => {
    const controller = new AbortController();
    const matchesInitialState =
      search === initialSearch &&
      selectedCategory === initialSelectedCategory &&
      selectedAudience === initialSelectedAudience &&
      sortBy === initialSort;

    if (matchesInitialState) {
      setProducts(initialProducts);
      setCategories(["All", ...initialCategories]);
      setAudiences(["All", ...initialAudiences]);
      setSource(initialSource);
      setLoading(false);
      setError("");
      return () => {
        controller.abort();
      };
    }

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }

        if (selectedAudience !== "All") {
          params.set("audience", selectedAudience);
        }

        params.set("sort", sortBy);

        const response = await fetch(
          `/api/products?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as {
          products?: CatalogProduct[];
          categories?: string[];
          audiences?: ProductAudience[];
          source?: string;
          error?: string;
        };

        if (!response.ok) {
          setError(data.error || "Unable to load products.");
          return;
        }

        setProducts(data.products || []);
        setCategories(["All", ...(data.categories || [])]);
        setAudiences(["All", ...(data.audiences || [])]);
        setSource(data.source || "");
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError("Unable to load products.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    initialCategories,
    initialAudiences,
    initialProducts,
    initialSource,
    initialSearch,
    initialSelectedCategory,
    initialSelectedAudience,
    initialSort,
    search,
    selectedAudience,
    selectedCategory,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedAudience("All");
    setSortBy("featured");
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedCategory !== "All" ||
    selectedAudience !== "All" ||
    sortBy !== "featured";

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>(
      (counts, category) => {
        if (category === "All") {
          counts[category] = products.length;
        } else {
          counts[category] = products.filter(
            (product) => product.category === category,
          ).length;
        }

        return counts;
      },
      {},
    );
  }, [categories, products]);

  const audienceCounts = useMemo(() => {
    return audiences.reduce<Record<string, number>>(
      (counts, audience) => {
        if (audience === "All") {
          counts[audience] = products.length;
        } else {
          counts[audience] = products.filter(
            (product) => product.audience === audience,
          ).length;
        }

        return counts;
      },
      {},
    );
  }, [audiences, products]);

  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="container products-hero-grid">
          <div>
            <p className="eyebrow">WEARWORTH PRODUCT ARCHIVE</p>

            <h1>
              Find the chapter
              <span>that feels like you.</span>
            </h1>
          </div>

          <div className="products-hero-copy">
            <p>
              Explore clothing inspired by identity, courage, ambition,
              belonging and the person you are still becoming.
            </p>

            <div className="products-hero-stats">
              <div>
                <strong>{products.length}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>{Math.max(categories.length - 1, 0)}</strong>
                <span>Categories</span>
              </div>
              <div>
                <strong>{source === "database" ? "DB" : "HY"}</strong>
                <span>
                  {source === "database" ? "Live Catalog" : "Fallback"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="products-toolbar-section">
        <div className="container products-toolbar">
          <div className="products-search">
            <Search size={20} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, stories or categories"
              aria-label="Search products"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="products-toolbar-actions">
            <button
              type="button"
              className="products-filter-button"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={18} />
              FILTERS
            </button>

            <label className="products-sort">
              <span>SORT BY</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as ProductSortOption)
                }
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="products-content container">
        <aside className="products-sidebar">
          <div className="products-sidebar-heading">
            <p>FILTER PRODUCTS</p>

            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}>
                CLEAR ALL
              </button>
            )}
          </div>

          <div className="products-filter-group">
            <p>CATEGORY</p>

            <div className="products-category-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    selectedCategory === category
                      ? "products-category-active"
                      : ""
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  <span>{category}</span>
                  <small>{categoryCounts[category] || 0}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="products-filter-group">
            <p>AUDIENCE</p>

            <div className="products-category-list">
              {audiences.map((audience) => (
                <button
                  type="button"
                  key={audience}
                  className={
                    selectedAudience === audience
                      ? "products-category-active"
                      : ""
                  }
                  onClick={() => setSelectedAudience(audience)}
                >
                  <span>{audience}</span>
                  <small>{audienceCounts[audience] || 0}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="products-sidebar-story">
            <span>THE WEARWORTH BELIEF</span>
            <blockquote>
              "The right piece should feel like part of your story."
            </blockquote>
          </div>
        </aside>

        <div className="products-main">
          <div className="products-results-heading">
            <div>
              <p>
                SHOWING <strong>{products.length}</strong>{" "}
                {products.length === 1 ? "PRODUCT" : "PRODUCTS"}
              </p>

              {selectedCategory !== "All" && (
                <span>Category: {selectedCategory}</span>
              )}
              {selectedAudience !== "All" && (
                <span>Audience: {selectedAudience}</span>
              )}
            </div>

            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}>
                RESET FILTERS
              </button>
            )}
          </div>

          {loading ? <div className="account-list-loading" /> : null}
          {error ? <div className="account-form-error">{error}</div> : null}

          {!loading && !error && products.length > 0 ? (
            <div className="product-grid products-page-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}

          {!loading && !error && products.length === 0 ? (
            <div className="products-empty-state">
              <p className="eyebrow">NO MATCH FOUND</p>
              <h2>We could not find that chapter.</h2>
              <p>Try another search term or remove your current filters.</p>
              <button
                type="button"
                className="button primary"
                onClick={clearFilters}
              >
                SHOW ALL PRODUCTS
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <div
        className={`products-mobile-filter ${
          filtersOpen ? "products-mobile-filter-open" : ""
        }`}
      >
        <button
          type="button"
          className="products-mobile-filter-overlay"
          onClick={() => setFiltersOpen(false)}
          aria-label="Close filters"
        />

        <aside className="products-mobile-filter-panel">
          <div className="products-mobile-filter-header">
            <div>
              <p>FILTER PRODUCTS</p>
              <span>{products.length} results</span>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            >
              <X size={23} />
            </button>
          </div>

          <div className="products-filter-group">
            <p>CATEGORY</p>
            <div className="products-category-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    selectedCategory === category
                      ? "products-category-active"
                      : ""
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  <span>{category}</span>
                  <small>{categoryCounts[category] || 0}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="products-filter-group">
            <p>AUDIENCE</p>
            <div className="products-category-list">
              {audiences.map((audience) => (
                <button
                  type="button"
                  key={audience}
                  className={
                    selectedAudience === audience
                      ? "products-category-active"
                      : ""
                  }
                  onClick={() => setSelectedAudience(audience)}
                >
                  <span>{audience}</span>
                  <small>{audienceCounts[audience] || 0}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="products-mobile-sort">
            <span>SORT BY</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as ProductSortOption)
              }
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
              <option value="name-za">Name: Z to A</option>
            </select>
          </label>

          <div className="products-mobile-filter-actions">
            <button type="button" onClick={clearFilters}>
              CLEAR ALL
            </button>

            <button type="button" onClick={() => setFiltersOpen(false)}>
              VIEW {products.length} PRODUCTS
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
