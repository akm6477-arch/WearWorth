import ProductsPageClient from "@/app/products/ProductsPageClient";
import { getCatalogProducts } from "@/lib/catalog";
import type {
  ProductAudience,
  ProductSortOption,
} from "@/lib/catalog-types";

interface ProductsPageProps {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
}

const SORT_OPTIONS = new Set<ProductSortOption>([
  "featured",
  "price-low",
  "price-high",
  "name-az",
  "name-za",
  "newest",
]);

const AUDIENCE_OPTIONS = new Set<ProductAudience>([
  "MEN",
  "WOMEN",
  "UNISEX",
]);

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const initialSearch = readSearchParam(params.search);
  const initialSelectedCategory =
    readSearchParam(params.category) || "All";
  const audienceParam = readSearchParam(
    params.audience,
  ).toUpperCase();
  const initialSelectedAudience = AUDIENCE_OPTIONS.has(
    audienceParam as ProductAudience,
  )
    ? audienceParam
    : "All";
  const sortParam = readSearchParam(params.sort);
  const initialSort = SORT_OPTIONS.has(
    sortParam as ProductSortOption,
  )
    ? (sortParam as ProductSortOption)
    : "featured";

  const initialCatalogResult = await getCatalogProducts({
    search: initialSearch || undefined,
    category:
      initialSelectedCategory === "All"
        ? undefined
        : initialSelectedCategory,
    audience:
      initialSelectedAudience === "All"
        ? "all"
        : (initialSelectedAudience as ProductAudience),
    sort: initialSort,
  });
  const allProductsResult = await getCatalogProducts();

  const initialCategories = Array.from(
    new Set(
      allProductsResult.products.map(
        (product) => product.category,
      ),
    ),
  ).sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory),
  );
  const initialAudiences = Array.from(
    new Set(
      allProductsResult.products.map(
        (product) => product.audience,
      ),
    ),
  ).sort((firstAudience, secondAudience) =>
    firstAudience.localeCompare(secondAudience),
  );

  return (
    <ProductsPageClient
      initialCategories={initialCategories}
      initialAudiences={initialAudiences}
      initialProducts={initialCatalogResult.products}
      initialSource={initialCatalogResult.source}
      initialSearch={initialSearch}
      initialSelectedCategory={initialSelectedCategory}
      initialSelectedAudience={initialSelectedAudience}
      initialSort={initialSort}
    />
  );
}
