import { NextRequest, NextResponse } from "next/server";

import { getCatalogProducts } from "@/lib/catalog";
import type {
  ProductAudience,
  ProductSortOption,
} from "@/lib/catalog-types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const audience = (searchParams.get("audience") ||
    undefined) as ProductAudience | "all" | undefined;
  const sort = (searchParams.get("sort") ||
    "featured") as ProductSortOption;
  const featuredOnly =
    searchParams.get("featured") === "true";

  const { products, source } = await getCatalogProducts({
    search,
    category,
    audience,
    sort,
    featuredOnly,
  });
  const allProductsResult = await getCatalogProducts();

  const categories = Array.from(
    new Set(
      allProductsResult.products.map(
        (product) => product.category,
      ),
    ),
  ).sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory),
  );
  const audiences = Array.from(
    new Set(
      allProductsResult.products.map(
        (product) => product.audience,
      ),
    ),
  ).sort((firstAudience, secondAudience) =>
    firstAudience.localeCompare(secondAudience),
  );

  return NextResponse.json({
    products,
    categories,
    audiences,
    source,
  });
}
