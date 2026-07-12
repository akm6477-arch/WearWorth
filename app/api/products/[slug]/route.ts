import { NextRequest, NextResponse } from "next/server";

import {
  getCatalogProductBySlug,
  getCatalogProducts,
} from "@/lib/catalog";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { slug } = await context.params;
  const productResult = await getCatalogProductBySlug(slug);

  if (!productResult.product) {
    return NextResponse.json(
      {
        error: "Product not found.",
      },
      {
        status: 404,
      },
    );
  }

  const relatedResult = await getCatalogProducts({
    category: productResult.product.category,
    sort: "featured",
  });

  return NextResponse.json({
    product: productResult.product,
    relatedProducts: relatedResult.products
      .filter((product) => product.slug !== slug)
      .slice(0, 4),
    source: productResult.source,
  });
}
