import { NextRequest, NextResponse } from "next/server";

import { getCatalogProducts } from "@/lib/catalog";
import type { ProductSortOption } from "@/lib/catalog-types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const sort = (searchParams.get("sort") ||
    "featured") as ProductSortOption;
  const featuredOnly =
    searchParams.get("featured") === "true";

  const { products, source } = await getCatalogProducts({
    search,
    category,
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

  return NextResponse.json({
    products,
    categories,
    source,
  });
}
