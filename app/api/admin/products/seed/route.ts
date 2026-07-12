import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { generatedProducts } from "@/lib/generated-products";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const existingProducts = await prisma.product.findMany({
      select: {
        slug: true,
      },
    });

    const existingSlugs = new Set(
      existingProducts.map((product) => product.slug),
    );

    const productsToCreate = generatedProducts.filter(
      (product) => !existingSlugs.has(product.slug),
    );

    if (productsToCreate.length > 0) {
      await prisma.product.createMany({
        data: productsToCreate,
      });
    }

    return NextResponse.json({
      message: "Starter catalog import completed.",
      totalPrepared: generatedProducts.length,
      created: productsToCreate.length,
      skipped: generatedProducts.length - productsToCreate.length,
    });
  } catch (error) {
    console.error("ADMIN_SEED_PRODUCTS_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Sample products cannot be imported right now."
          : "Unable to import sample products right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
